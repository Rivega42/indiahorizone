/**
 * SuspiciousLoginListener — отправка email при auth.session.suspicious (#136).
 *
 * Подписывается на event_type=`auth.session.suspicious` через events-bus.
 * При получении достаёт user.email из БД (соответствует userId из payload),
 * отправляет email-уведомление с CTA «Сменить пароль» (использует #134 flow).
 *
 * Privacy: full IP в payload не публикуется (см. detector). Здесь работаем
 * с уже masked-IP. UA truncated to 200 chars в детекторе.
 */
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EventsBusService } from '../../../common/events-bus/events-bus.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotifyService } from '../notify.service';

import type { DomainEvent } from '../../../common/events-bus/types';

interface SuspiciousPayload {
  userId: string;
  sessionId: string;
  reasons: string[];
  ipMasked: string;
  userAgent: string;
  previousSessionAt: string;
}

@Injectable()
export class SuspiciousLoginListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SuspiciousLoginListener.name);
  private subscription: { stop: () => void } | null = null;

  constructor(
    private readonly bus: EventsBusService,
    private readonly notify: NotifyService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    this.subscription = this.bus.subscribe<SuspiciousPayload>(
      'auth.session.suspicious',
      this.handleEvent.bind(this),
      {
        consumerGroup: 'comm-svc-suspicious',
        consumerName: 'suspicious-1',
      },
    );
    this.logger.log('suspicious-login.listener.started');
  }

  onModuleDestroy(): void {
    this.subscription?.stop();
    this.subscription = null;
  }

  private async handleEvent(event: DomainEvent<SuspiciousPayload>): Promise<void> {
    const { userId, ipMasked, userAgent } = event.payload;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) {
      this.logger.warn({ userId }, 'suspicious-login.user-not-found');
      return; // user удалён — пропускаем silently
    }

    const appUrl = this.config.get<string>('APP_URL', 'https://indiahorizone.ru');
    const resetPasswordUrl = `${appUrl}/forgot-password`;
    const loggedAt = new Date(event.occurredAt).toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    try {
      await this.notify.send({
        channel: 'email',
        to: user.email,
        templateId: 'suspicious-login',
        data: {
          ipMasked,
          userAgent: userAgent.length > 80 ? `${userAgent.slice(0, 80)}…` : userAgent,
          loggedAt,
          resetPasswordUrl,
        },
        userId,
        // Suspicious-login = security-critical, system category (не блокируется preferences).
        category: 'system',
      });
    } catch (err) {
      // Re-throw — events-bus retry-цикл подхватит. Если SMTP временно недоступен,
      // лучше ретраить: уведомление о подозрительном входе — security-критично.
      this.logger.error({ err, userId }, 'suspicious-login.email.failed');
      throw err;
    }
  }
}
