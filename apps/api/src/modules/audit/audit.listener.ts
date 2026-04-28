/**
 * AuditEventListener — wildcard subscriber на ВСЕ domain events (#218).
 *
 * При onModuleInit подписываемся на `*` через EventsBusService. Каждое событие,
 * прошедшее outbox-relay, записывается в `audit_events` (append-only).
 *
 * Idempotency: уже обеспечена на уровне EventsBusService.subscribe (через
 * processed_events таблицу #120). Здесь дополнительно есть PRIMARY KEY на
 * event_id в audit_events — повторная вставка одного eventId упадёт с P2002,
 * который мы игнорируем (already-recorded → skip).
 *
 * Append-only (миграция): UPDATE и DELETE заблокированы Postgres-триггером.
 * Никто, включая admin'а через Prisma — не может изменить audit-запись.
 *
 * Соответствует docs/ARCH/SECURITY/AUDIT_LOG.md.
 */
import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';

import { EventsBusService } from '../../common/events-bus/events-bus.service';
import { PrismaService } from '../../common/prisma/prisma.service';

import type { DomainEvent } from '../../common/events-bus/types';
import type { Prisma } from '@prisma/client';

const CONSUMER_GROUP = 'audit-svc';
const CONSUMER_NAME = 'audit-1';
const PRISMA_UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class AuditEventListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditEventListener.name);
  private subscriptions: { stop: () => void }[] = [];

  constructor(
    private readonly bus: EventsBusService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    // Подписываемся на оба stream'а: default и SOS-priority.
    // Wildcard `*` в EventsBus обозначает «обрабатывать любой type внутри stream'а».
    const defaultSub = this.bus.subscribe<unknown>(
      '*',
      this.handleEvent.bind(this),
      {
        consumerGroup: CONSUMER_GROUP,
        consumerName: CONSUMER_NAME,
      },
    );
    this.subscriptions.push(defaultSub);

    this.logger.log({ group: CONSUMER_GROUP, consumer: CONSUMER_NAME }, 'audit.listener.started');
  }

  onModuleDestroy(): void {
    for (const sub of this.subscriptions) {
      sub.stop();
    }
    this.subscriptions = [];
  }

  private async handleEvent(event: DomainEvent<unknown>): Promise<void> {
    try {
      await this.prisma.auditEvent.create({
        data: {
          eventId: event.id,
          type: event.type,
          actor: event.actor as unknown as Prisma.InputJsonValue,
          payload: event.payload as Prisma.InputJsonValue,
          occurredAt: new Date(event.occurredAt),
          schemaVersion: event.schemaVersion,
          ...(event.correlationId !== undefined ? { correlationId: event.correlationId } : {}),
          ...(event.causationId !== undefined ? { causationId: event.causationId } : {}),
        },
      });
    } catch (error) {
      // P2002 — duplicate eventId. Возможно при at-least-once delivery если
      // markProcessed упал между записью и ack'ом. Не ошибка — пропускаем.
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code?: string }).code === PRISMA_UNIQUE_VIOLATION
      ) {
        this.logger.debug(
          { eventId: event.id, type: event.type },
          'audit.event.already-recorded',
        );
        return;
      }
      // Любая другая ошибка — re-throw, чтобы EventsBus НЕ ack'нул сообщение
      // и оно попало в retry. Audit-log не должен терять записи.
      this.logger.error(
        { err: error, eventId: event.id, type: event.type },
        'audit.event.write.failed',
      );
      throw error;
    }
  }
}
