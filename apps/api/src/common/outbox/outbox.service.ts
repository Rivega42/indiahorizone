import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { DomainEvent } from '../events-bus/types';
import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * OutboxService — запись событий в outbox в той же транзакции, что и
 * бизнес-операция. После commit'а транзакции outbox-relay воркер
 * (см. OutboxRelayWorker) подхватит запись и опубликует в Redis Streams.
 *
 * Использование:
 *
 *   await this.prisma.$transaction(async (tx) => {
 *     const user = await tx.user.create({ data: { ... } });
 *     await this.outbox.add(tx, {
 *       type: 'auth.user.registered',
 *       schemaVersion: 1,
 *       actor: { type: 'user', id: user.id },
 *       payload: { userId: user.id, email: user.email },
 *     });
 *     return user;
 *   });
 *
 * Если транзакция откатилась — outbox-запись тоже откатилась. Если коммит
 * прошёл — relay-worker заберёт и опубликует at-least-once.
 *
 * Соответствует docs/ARCH/EVENTS.md § Сначала commit DB, потом publish.
 */
@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Записать событие в outbox в рамках переданной транзакции.
   *
   * @param tx — Prisma transaction client (получается через prisma.$transaction)
   * @param event — DomainEvent без id/occurredAt (генерируются здесь)
   *
   * Возвращает eventId — UUIDv4, который попадёт в DomainEvent.id при
   * публикации. Можно использовать для последующего отслеживания и
   * idempotency на стороне subscribers.
   */
  async add<T>(
    tx: Prisma.TransactionClient | PrismaClient,
    event: Omit<DomainEvent<T>, 'id' | 'occurredAt'>,
  ): Promise<string> {
    const eventId = randomUUID();
    const occurredAt = new Date().toISOString();

    const fullEnvelope: DomainEvent<T> = {
      id: eventId,
      occurredAt,
      type: event.type,
      schemaVersion: event.schemaVersion,
      correlationId: event.correlationId,
      causationId: event.causationId,
      actor: event.actor,
      payload: event.payload,
    };

    await tx.outboxEntry.create({
      data: {
        eventId,
        eventType: event.type,
        schemaVersion: event.schemaVersion,
        payload: fullEnvelope as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.debug({ eventId, type: event.type }, 'outbox.added');
    return eventId;
  }

  /**
   * Без транзакции — для случаев, когда событие публикуется вне business-операции
   * (например, scheduled job-ы, system events). Нужно использовать осознанно —
   * стандартный path всегда через add() с tx.
   */
  async addStandalone<T>(event: Omit<DomainEvent<T>, 'id' | 'occurredAt'>): Promise<string> {
    return this.add(this.prisma, event);
  }
}
