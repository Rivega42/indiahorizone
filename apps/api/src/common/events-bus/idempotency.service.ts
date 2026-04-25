import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const TTL_DAYS = 30;
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1_000; // каждые 6 часов

/**
 * IdempotencyService — обёртка для at-least-once → exactly-once на уровне
 * subscriber'а через таблицу processed_events.
 *
 * Использование (внутри EventsBusService.subscribe handler-wrapper):
 *
 *   if (await idempotency.isProcessed(event.id, consumer)) {
 *     return; // skip
 *   }
 *   await handler(event);
 *   await idempotency.markProcessed(event.id, consumer);
 *
 * TTL 30 дней — после этого срока запись удаляется scheduled-job'ом.
 * Достаточно: Redis Streams сохраняют события 14 дней, любой retry-цикл
 * должен закрыться в этом окне.
 *
 * Соответствует docs/ARCH/EVENTS.md § Идемпотентность.
 */
@Injectable()
export class IdempotencyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IdempotencyService.name);
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    this.cleanupTimer = setInterval(() => {
      void this.cleanup();
    }, CLEANUP_INTERVAL_MS);
    this.logger.log({ ttlDays: TTL_DAYS }, 'idempotency.scheduler.started');
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  /**
   * Проверяет, обработано ли событие данным consumer'ом.
   */
  async isProcessed(eventId: string, consumer: string): Promise<boolean> {
    const found = await this.prisma.processedEvent.findUnique({
      where: { eventId_consumer: { eventId, consumer } },
      select: { eventId: true },
    });
    return found !== null;
  }

  /**
   * Помечает событие как обработанное. Идемпотентен сам по себе через unique constraint.
   *
   * При concurrent обработке двумя инстансами одного consumer'а — один из
   * вызовов получит P2002 (unique violation), который мы игнорируем
   * (значит другой инстанс успел первым; работа уже сделана).
   */
  async markProcessed(eventId: string, consumer: string): Promise<void> {
    try {
      await this.prisma.processedEvent.create({
        data: { eventId, consumer },
      });
    } catch (error) {
      // Prisma P2002 — unique constraint violation
      if (
        error instanceof Error &&
        'code' in error &&
        (error as unknown as { code: string }).code === 'P2002'
      ) {
        return;
      }
      throw error;
    }
  }

  /**
   * Cleanup записей старше TTL_DAYS. Запускается scheduled-job'ом.
   */
  async cleanup(): Promise<void> {
    const cutoff = new Date(Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000);

    try {
      const result = await this.prisma.processedEvent.deleteMany({
        where: { processedAt: { lt: cutoff } },
      });

      if (result.count > 0) {
        this.logger.log(
          { deleted: result.count, cutoff: cutoff.toISOString() },
          'idempotency.cleanup',
        );
      }
    } catch (error) {
      this.logger.error({ err: error }, 'idempotency.cleanup.failed');
    }
  }
}
