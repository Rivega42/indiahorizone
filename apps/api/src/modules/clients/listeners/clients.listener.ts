/**
 * ClientsListener — подписчик на domain events для модуля clients.
 *
 * Подписывается на auth.user.registered → вызывает ClientsService.provisionForUser().
 * Consumer group: clients-svc (один на модуль — масштабируемо при extraction в микросервис).
 *
 * Idempotency гарантирует EventsBusService — дублирующиеся события пропускаются
 * через таблицу processed_events.
 */
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import { EventsBusService } from '../../../common/events-bus/events-bus.service';
import { ClientsService } from '../clients.service';

interface UserRegisteredPayload {
  userId: string;
  email: string;
  role: string;
  source: string;
}

const CONSUMER_GROUP = 'clients-svc';
const CONSUMER_NAME = `clients-svc-${process.env['HOSTNAME'] ?? 'default'}`;

@Injectable()
export class ClientsListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClientsListener.name);
  private subscription?: { stop: () => void };

  constructor(
    private readonly eventsBus: EventsBusService,
    private readonly clients: ClientsService,
  ) {}

  onModuleInit(): void {
    this.subscription = this.eventsBus.subscribe<UserRegisteredPayload>(
      'auth.user.registered',
      async (event) => {
        this.logger.log(
          { eventId: event.id, userId: event.payload.userId },
          'clients.listener.auth.user.registered',
        );
        await this.clients.provisionForUser(event.payload.userId);
      },
      {
        consumerGroup: CONSUMER_GROUP,
        consumerName: CONSUMER_NAME,
      },
    );

    this.logger.log({ group: CONSUMER_GROUP, consumer: CONSUMER_NAME }, 'clients.listener.started');
  }

  onModuleDestroy(): void {
    this.subscription?.stop();
    this.logger.log('clients.listener.stopped');
  }
}
