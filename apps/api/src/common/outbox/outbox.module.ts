import { Global, Module } from '@nestjs/common';

import { OutboxRelayWorker } from './outbox-relay.worker';
import { OutboxService } from './outbox.service';

/**
 * Outbox Module — Transactional Outbox Pattern.
 *
 * Использование:
 *   constructor(private readonly outbox: OutboxService) {}
 *   await this.prisma.$transaction(async (tx) => {
 *     ...бизнес-логика...
 *     await this.outbox.add(tx, { type: 'auth.user.registered', ... });
 *   });
 *
 * OutboxRelayWorker запускается автоматически в onModuleInit() и публикует
 * записи в Redis Streams через EventsBusService.
 *
 * См. docs/ARCH/EVENTS.md § Сначала commit DB, потом publish.
 */
@Global()
@Module({
  providers: [OutboxService, OutboxRelayWorker],
  exports: [OutboxService],
})
export class OutboxModule {}

export { OutboxService } from './outbox.service';
