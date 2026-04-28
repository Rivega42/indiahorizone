/**
 * AuditService — чтение audit-log (#219).
 *
 * Append-only enforcement в БД (Postgres trigger из миграции #218) — этот
 * сервис **только читает**. Никаких write/delete методов не предоставляется.
 *
 * Pagination: cursor-based, opaque base64. Сортировка по (recorded_at DESC,
 * event_id DESC) — стабильна и допускает page-skipping без offset-перерасчёта.
 *
 * Логирование чтения: каждый list() публикует `audit.read` event через
 * outbox → wildcard subscriber #218 пишет в тот же audit_events. Recursive
 * but ok — позволяет узнать кто и когда смотрел audit (compliance).
 */
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { OutboxService } from '../../common/outbox/outbox.service';
import { PrismaService } from '../../common/prisma/prisma.service';

import type { ListAuditQueryDto, ListAuditResponse } from './dto/list-audit.dto';
import type { AuditEvent, Prisma } from '@prisma/client';

interface DecodedCursor {
  recordedAt: string; // ISO
  eventId: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  async list(
    requesterId: string,
    query: ListAuditQueryDto,
  ): Promise<ListAuditResponse> {
    const limit = query.limit ?? 50;

    const where: Prisma.AuditEventWhereInput = {};

    // type: exact или prefix (если ends with `.`)
    if (query.type) {
      if (query.type.endsWith('.')) {
        where.type = { startsWith: query.type };
      } else {
        where.type = query.type;
      }
    }

    // actor JSONB фильтры
    const actorFilter: Record<string, unknown> = {};
    if (query.actorId) {
      actorFilter['id'] = query.actorId;
    }
    if (query.actorType) {
      actorFilter['type'] = query.actorType;
    }
    if (Object.keys(actorFilter).length > 0) {
      // Prisma JSON-path matching: equals для каждого ключа
      where.actor = { equals: actorFilter as Prisma.InputJsonValue };
      // NB: equals требует FULL match; если нужно подмножество — переключить
      // на raw query с jsonb_path_match. Для admin-фильтра достаточно: либо
      // фильтруют по actorId only (system events), либо по actorType only (group),
      // либо по обоим (specific user). Полный объект actor имеет ещё `role` —
      // в этом случае точный equals не подойдёт. Это TODO для V2 (raw query).
    }

    // occurred_at range
    if (query.from || query.to) {
      where.occurredAt = {};
      if (query.from) {
        where.occurredAt.gte = new Date(query.from);
      }
      if (query.to) {
        where.occurredAt.lte = new Date(query.to);
      }
    }

    // Cursor — keyset pagination. Стабилен при concurrent writes.
    if (query.cursor) {
      const decoded = this.decodeCursor(query.cursor);
      // Берём записи СТРОГО ПОСЛЕ cursor'а в порядке (recordedAt DESC, eventId DESC)
      // SQL-эквивалент: WHERE (recorded_at, event_id) < (cursor.recordedAt, cursor.eventId)
      where.OR = [
        { recordedAt: { lt: new Date(decoded.recordedAt) } },
        {
          AND: [
            { recordedAt: new Date(decoded.recordedAt) },
            { eventId: { lt: decoded.eventId } },
          ],
        },
      ];
    }

    const items = await this.prisma.auditEvent.findMany({
      where,
      orderBy: [{ recordedAt: 'desc' }, { eventId: 'desc' }],
      take: limit + 1, // +1 чтобы определить есть ли следующая страница
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    let nextCursor: string | null = null;
    if (hasMore) {
      const last = page[page.length - 1] as AuditEvent;
      nextCursor = this.encodeCursor({
        recordedAt: last.recordedAt.toISOString(),
        eventId: last.eventId,
      });
    }

    // Логируем сам факт чтения (recursive — попадёт в audit через #218 subscriber).
    // ПДн в фильтрах не выдаём — сохраняем только что admin искал и сколько вернулось.
    await this.prisma.$transaction(async (tx) => {
      await this.outbox.add(tx, {
        type: 'audit.read',
        schemaVersion: 1,
        actor: { type: 'user', id: requesterId, role: 'admin' },
        payload: {
          requesterId,
          filters: {
            type: query.type ?? null,
            actorId: query.actorId ?? null,
            actorType: query.actorType ?? null,
            from: query.from ?? null,
            to: query.to ?? null,
          },
          returnedCount: page.length,
          hasMore,
        },
      });
    });

    return { items: page, nextCursor };
  }

  private encodeCursor(cursor: DecodedCursor): string {
    return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
  }

  private decodeCursor(raw: string): DecodedCursor {
    try {
      const json = Buffer.from(raw, 'base64url').toString('utf8');
      const parsed = JSON.parse(json) as Partial<DecodedCursor>;
      if (
        typeof parsed.recordedAt !== 'string' ||
        typeof parsed.eventId !== 'string' ||
        Number.isNaN(Date.parse(parsed.recordedAt))
      ) {
        throw new Error('invalid cursor shape');
      }
      return { recordedAt: parsed.recordedAt, eventId: parsed.eventId };
    } catch {
      throw new BadRequestException('Невалидный cursor');
    }
  }
}
