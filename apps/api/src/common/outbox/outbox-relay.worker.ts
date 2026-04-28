import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import { EventsBusService } from '../events-bus/events-bus.service';
import type { DomainEvent } from '../events-bus/types';
import { PrismaService } from '../prisma/prisma.service';

const POLL_INTERVAL_MS = 1_000;
const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;

/**
 * OutboxRelayWorker — background-loop, который забирает unpublished outbox-записи
 * и публикует их в Redis Streams через EventsBusService.
 *
 * Принципы:
 * - Polling 1 сек (для фазы 3 достаточно; в фазе 4 можно перейти на listen/notify
 *   через Postgres NOTIFY или отдельный leader-election worker).
 * - Batch 50 записей за раз — быстрее малого RPS обрабатывает burst'ы при
 *   массовых операциях (например, sales создаёт 100 trips подряд).
 * - At-least-once публикация: если XADD упал — оставляем published_at NULL,
 *   повторная попытка на следующем тике + инкремент attempts.
 * - После MAX_ATTEMPTS попыток — лог ERROR, оставляем в outbox для ручного
 *   разбора через admin-endpoint (в #119 не делаем — реализуется в audit-svc #218).
 *
 * Single-instance assumption: предполагается ОДИН worker на api-deployment
 * (фаза 3 — один контейнер). При scale-out — leader-election (фаза 4).
 */
@Injectable()
export class OutboxRelayWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private active = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventsBusService,
  ) {}

  onModuleInit(): void {
    this.active = true;
    this.scheduleNext();
    this.logger.log({ pollMs: POLL_INTERVAL_MS, batch: BATCH_SIZE }, 'outbox-relay.started');
  }

  onModuleDestroy(): void {
    this.active = false;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.logger.log('outbox-relay.stopped');
  }

  private scheduleNext(): void {
    if (!this.active) return;
    this.timer = setTimeout(() => {
      void this.tick();
    }, POLL_INTERVAL_MS);
  }

  private async tick(): Promise<void> {
    try {
      await this.processBatch();
    } catch (error) {
      this.logger.error({ err: error }, 'outbox-relay.tick.failed');
    } finally {
      this.scheduleNext();
    }
  }

  private async processBatch(): Promise<void> {
    const entries = await this.prisma.outboxEntry.findMany({
      where: {
        publishedAt: null,
        attempts: { lt: MAX_ATTEMPTS },
      },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
    });

    if (entries.length === 0) {
      return;
    }

    this.logger.debug({ count: entries.length }, 'outbox-relay.batch');

    for (const entry of entries) {
      const envelope = entry.payload as unknown as DomainEvent;
      try {
        await this.bus.publish({
          id: entry.eventId,
          occurredAt: envelope.occurredAt ?? entry.createdAt.toISOString(),
          type: entry.eventType,
          schemaVersion: entry.schemaVersion,
          ...(envelope.correlationId !== undefined && { correlationId: envelope.correlationId }),
          ...(envelope.causationId !== undefined && { causationId: envelope.causationId }),
          actor: envelope.actor,
          payload: envelope.payload,
        });

        await this.prisma.outboxEntry.update({
          where: { id: entry.id },
          data: { publishedAt: new Date() },
        });
      } catch (error) {
        const newAttempts = entry.attempts + 1;
        this.logger.warn(
          { err: error, eventId: entry.eventId, type: entry.eventType, attempts: newAttempts },
          'outbox-relay.publish.failed',
        );

        await this.prisma.outboxEntry.update({
          where: { id: entry.id },
          data: { attempts: newAttempts },
        });

        if (newAttempts >= MAX_ATTEMPTS) {
          this.logger.error(
            { eventId: entry.eventId, type: entry.eventType },
            'outbox-relay.dlq',
          );
          // TODO (audit-svc #218): отправить в DLQ-stream для ручного разбора
        }
      }
    }
  }
}
