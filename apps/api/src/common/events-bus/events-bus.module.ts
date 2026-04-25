import { Global, Module } from '@nestjs/common';

import { EventsBusService } from './events-bus.service';
import { IdempotencyService } from './idempotency.service';

/**
 * Global EventsBus module — обёртка над Redis Streams.
 * Использование:
 *   constructor(private readonly bus: EventsBusService) {}
 *   await this.bus.publish({ type: 'auth.user.registered', ... });
 *
 * Принципы:
 * - publish() из bizz-логики НЕ вызывается напрямую. Используется outbox-pattern (#119).
 * - Subscribers регистрируются через bus.subscribe() в onModuleInit() конкретного модуля.
 * - Идемпотентность handler'а гарантирована автоматически через
 *   IdempotencyService (#120) — на основе таблицы processed_events.
 *
 * См. docs/ARCH/EVENTS.md.
 */
@Global()
@Module({
  providers: [EventsBusService, IdempotencyService],
  exports: [EventsBusService, IdempotencyService],
})
export class EventsBusModule {}

export { EventsBusService } from './events-bus.service';
export { IdempotencyService } from './idempotency.service';
export type {
  DomainEvent,
  EventActor,
  EventActorType,
  EventHandler,
  SubscribeOptions,
} from './types';
export { STREAM_DEFAULT, STREAM_SOS_PRIORITY, streamForEventType } from './types';
