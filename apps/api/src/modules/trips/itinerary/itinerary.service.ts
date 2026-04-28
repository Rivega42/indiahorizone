/**
 * ItineraryService — версионирование маршрутов (#151).
 *
 * Поток:
 * 1. PATCH /trips/:id/itinerary → upsertVersion(tripId, days) — создаёт ДРАФТ
 *    (новая Itinerary с version=N+1, publishedAt=null) или дополняет последний
 *    неопубликованный draft.
 * 2. POST /trips/:id/itinerary/publish → publishLatest(tripId) — старая
 *    "published" остаётся (история), новая получает publishedAt=now.
 * 3. GET /trips/:id/itinerary — return last where publishedAt is not null.
 *
 * Уникальный (trip_id, version) гарантируется БД — параллельный publish одного
 * draft двумя manager'ами один из них получит P2002 → caller ретраит на
 * актуальной версии.
 *
 * Diff на publish:
 * - Сравниваем НОВЫЕ days (только что published) с ПРЕДЫДУЩИМИ published.
 * - addedDays / removedDays — по dayNumber
 * - changedDays — где summary, date или items[] отличаются (deep equal)
 * - Diff сохраняется в outbox event `trips.itinerary.updated` для audit (#218)
 */
import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

import type {
  CreateVersionResponse,
  DayPlanInputDto,
  ItineraryWithDays,
  PublishResponse,
} from './dto/itinerary.dto';
import type { DayPlan, Prisma, UserRole } from '@prisma/client';

@Injectable()
export class ItineraryService {
  private readonly logger = new Logger(ItineraryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * PATCH /trips/:id/itinerary — создать новый draft Itinerary с днями.
   *
   * Идемпотентность: если последняя Itinerary draft (publishedAt=null) —
   * перезаписываем её days (full replace). Если последняя published —
   * создаём новую version=N+1 с publishedAt=null.
   */
  async upsertDraft(
    tripId: string,
    creatorUserId: string,
    days: DayPlanInputDto[],
  ): Promise<CreateVersionResponse> {
    await this.assertTripExists(tripId);

    return this.prisma.$transaction(async (tx) => {
      const lastVersion = await tx.itinerary.findFirst({
        where: { tripId },
        orderBy: { version: 'desc' },
        select: { id: true, version: true, publishedAt: true },
      });

      let itineraryId: string;
      let version: number;

      if (lastVersion?.publishedAt === null) {
        // Reuse существующий draft — full-replace days.
        await tx.dayPlan.deleteMany({ where: { itineraryId: lastVersion.id } });
        itineraryId = lastVersion.id;
        version = lastVersion.version;
      } else {
        // Создаём новую version (предыдущая published, или вообще первая).
        const nextVersion = (lastVersion?.version ?? 0) + 1;
        const created = await tx.itinerary.create({
          data: { tripId, version: nextVersion },
          select: { id: true, version: true },
        });
        itineraryId = created.id;
        version = created.version;
      }

      // Bulk insert days.
      await tx.dayPlan.createMany({
        data: days.map((d) => ({
          itineraryId,
          dayNumber: d.dayNumber,
          date: new Date(d.date),
          summary: d.summary,
          items: d.items as Prisma.InputJsonValue,
        })),
      });

      this.logger.log(
        { tripId, itineraryId, version, daysCount: days.length, creatorUserId },
        'itinerary.draft.upserted',
      );

      return { itineraryId, version, daysCount: days.length };
    });
  }

  /**
   * Опубликовать последний draft. Diff между новой и предыдущей published
   * → outbox event trips.itinerary.updated.
   *
   * При невалидной last (нет draft'а или уже published) — 409 Conflict
   * (через NotFound для simplicity сейчас).
   */
  async publishLatest(tripId: string, publisherUserId: string): Promise<PublishResponse> {
    await this.assertTripExists(tripId);

    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.itinerary.findFirst({
        where: { tripId, publishedAt: null },
        orderBy: { version: 'desc' },
        select: { id: true, version: true },
      });

      if (!draft) {
        throw new NotFoundException(
          'Нет draft itinerary для публикации. Сначала PATCH /itinerary.',
        );
      }

      const previouslyPublished = await tx.itinerary.findFirst({
        where: { tripId, publishedAt: { not: null } },
        orderBy: { version: 'desc' },
        select: { id: true, version: true },
      });

      // Получаем days обоих versions для diff.
      const [newDays, oldDays] = await Promise.all([
        tx.dayPlan.findMany({ where: { itineraryId: draft.id } }),
        previouslyPublished
          ? tx.dayPlan.findMany({ where: { itineraryId: previouslyPublished.id } })
          : Promise.resolve([] as DayPlan[]),
      ]);

      const diff = computeDiff(oldDays, newDays);

      const now = new Date();
      await tx.itinerary.update({
        where: { id: draft.id },
        data: { publishedAt: now },
      });

      await this.outbox.add(tx, {
        type: 'trips.itinerary.updated',
        schemaVersion: 1,
        actor: { type: 'user', id: publisherUserId },
        payload: {
          tripId,
          itineraryId: draft.id,
          version: draft.version,
          publishedAt: now.toISOString(),
          previousVersion: previouslyPublished?.version ?? null,
          dayPlanIds: newDays.map((d) => d.id),
          diff,
        },
      });

      this.logger.log(
        {
          tripId,
          itineraryId: draft.id,
          version: draft.version,
          addedDays: diff.addedDays.length,
          removedDays: diff.removedDays.length,
          changedDays: diff.changedDays.length,
        },
        'itinerary.published',
      );

      return {
        itineraryId: draft.id,
        version: draft.version,
        publishedAt: now,
        diff: {
          addedDays: diff.addedDays,
          removedDays: diff.removedDays,
          changedDays: diff.changedDays,
          hadPrevious: previouslyPublished !== null,
        },
      };
    });
  }

  /**
   * GET /trips/:id/itinerary — последняя published version (для клиента).
   * Если нет published — 404 (даже если есть draft — клиент его не видит).
   */
  async getLatestPublished(
    tripId: string,
    userId: string,
    role: UserRole,
  ): Promise<ItineraryWithDays> {
    await this.assertReadAccess(userId, role, tripId);

    const itinerary = await this.prisma.itinerary.findFirst({
      where: { tripId, publishedAt: { not: null } },
      orderBy: { version: 'desc' },
      include: { days: { orderBy: { dayNumber: 'asc' } } },
    });
    if (!itinerary) {
      throw new NotFoundException('Маршрут ещё не опубликован');
    }
    return itinerary;
  }

  // ─── access helpers ───

  private async assertTripExists(tripId: string): Promise<void> {
    const exists = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Trip не найден: ${tripId}`);
    }
  }

  /**
   * GET доступ:
   * - admin / manager / concierge / finance → все trips
   * - client → только own trip (через Trip.clientId → Client.userId)
   */
  private async assertReadAccess(userId: string, role: UserRole, tripId: string): Promise<void> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { clientId: true },
    });
    if (!trip) {
      throw new NotFoundException('Trip не найден');
    }

    if (role === 'admin' || role === 'manager' || role === 'concierge' || role === 'finance') {
      return;
    }

    if (role === 'client') {
      const client = await this.prisma.client.findUnique({
        where: { id: trip.clientId },
        select: { userId: true },
      });
      if (client?.userId === userId) return;
    }

    throw new ForbiddenException('Нет доступа к маршруту этого trip');
  }
}

/**
 * Diff между two наборами days по dayNumber.
 *
 * - added: dayNumber есть в new, нет в old
 * - removed: dayNumber есть в old, нет в new
 * - changed: dayNumber в обоих, но summary/date/items отличаются
 */
function computeDiff(
  oldDays: DayPlan[],
  newDays: DayPlan[],
): {
  addedDays: number[];
  removedDays: number[];
  changedDays: number[];
} {
  const oldByNumber = new Map<number, DayPlan>();
  for (const d of oldDays) oldByNumber.set(d.dayNumber, d);
  const newByNumber = new Map<number, DayPlan>();
  for (const d of newDays) newByNumber.set(d.dayNumber, d);

  const addedDays: number[] = [];
  const removedDays: number[] = [];
  const changedDays: number[] = [];

  for (const [n, newD] of newByNumber) {
    const oldD = oldByNumber.get(n);
    if (!oldD) {
      addedDays.push(n);
      continue;
    }
    if (
      newD.summary !== oldD.summary ||
      newD.date.getTime() !== oldD.date.getTime() ||
      JSON.stringify(newD.items) !== JSON.stringify(oldD.items)
    ) {
      changedDays.push(n);
    }
  }

  for (const n of oldByNumber.keys()) {
    if (!newByNumber.has(n)) removedDays.push(n);
  }

  addedDays.sort((a, b) => a - b);
  removedDays.sort((a, b) => a - b);
  changedDays.sort((a, b) => a - b);

  return { addedDays, removedDays, changedDays };
}
