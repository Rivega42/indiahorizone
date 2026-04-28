/**
 * WelcomeEmailListener — отправка welcome email при auth.user.registered (#162).
 *
 * Подписывается на event_type=`auth.user.registered`. При получении:
 * 1. Извлекает email + role из payload
 * 2. Вызывает NotifyService.send({channel: 'email', templateId: 'welcome', ...})
 * 3. NotifyService уже сам пишет Notification record + outbox events
 *
 * Идемпотентность: гарантирована через events-bus → idempotency.service
 * (processed_events таблица). Этот listener — обычный consumer, при retry
 * пропускается.
 *
 * Failure handling: если email не отправился, throw'аем — events-bus не ack'нет
 * сообщение, оно попадёт в retry. После N попыток → DLQ (см. outbox-relay.worker
 * MAX_ATTEMPTS).
 */
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EventsBusService } from '../../../common/events-bus/events-bus.service';
import { NotifyService } from '../notify.service';

import type { DomainEvent } from '../../../common/events-bus/types';

interface UserRegisteredPayload {
  userId: string;
  email: string;
  role: string;
  source?: string;
}

@Injectable()
export class WelcomeEmailListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WelcomeEmailListener.name);
  private subscription: { stop: () => void } | null = null;

  constructor(
    private readonly bus: EventsBusService,
    private readonly notify: NotifyService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    this.subscription = this.bus.subscribe<UserRegisteredPayload>(
      'auth.user.registered',
      this.handleEvent.bind(this),
      {
        consumerGroup: 'comm-svc-welcome',
        consumerName: 'welcome-1',
      },
    );
    this.logger.log('welcome.listener.started');
  }

  onModuleDestroy(): void {
    this.subscription?.stop();
    this.subscription = null;
  }

  private async handleEvent(event: DomainEvent<UserRegisteredPayload>): Promise<void> {
    const { userId, email, role } = event.payload;

    // Welcome email только для роли client. Manager/admin/finance заводятся
    // вручную и не нуждаются в onboarding-emails.
    if (role !== 'client') {
      this.logger.debug({ userId, role }, 'welcome.skip.non-client');
      return;
    }

    const appUrl = this.config.get<string>('APP_URL', 'https://indiahorizone.ru');

    try {
      await this.notify.send({
        channel: 'email',
        to: email,
        templateId: 'welcome',
        data: {
          // firstName пока недоступен (профиль ещё пустой при register).
          // При появлении ProfileCompleted event'а — отдельный onboarding email.
          firstName: '',
          appUrl,
        },
        userId,
      });
    } catch (err) {
      // Re-throw — events-bus retry-цикл подхватит. После MAX_ATTEMPTS попыток
      // outbox пометит как DLQ (#218 audit видит auth.user.registered в любом
      // случае, даже без welcome email).
      this.logger.error({ err, userId, email }, 'welcome.email.failed');
      throw err;
    }
  }
}
