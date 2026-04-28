/**
 * TripsService — бизнес-логика модуля trips.
 *
 * Currently:
 * - createTrip (#150) — создание Trip + outbox `trips.created`
 * - listForUser (#361) — RBAC-aware list (client/manager/admin)
 * - findById (#361) — single trip с details
 *
 * Будущее (#160): status transitions.
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { OutboxService } from '../../common/outbox/outbox.service';
import { PrismaService } from '../../common/prisma/prisma.service';

import type { Trip, UserRole } from '@prisma/client';

export interface CreateTripInput {
  clientId: string;
  startsAt: Date;
  endsAt: Date;
  region: string;
  totalAmount?: bigint | undefined;
  currency?: string | undefined;
  /** userId менеджера / admin'а, который создаёт поездку */
  createdBy: string;
}

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Создание Trip в статусе draft. Публикует `trips.created` через outbox.
   *
   * Валидация:
   * - endsAt > startsAt (пустой/обратный диапазон отклоняем)
   * - clientId существует (cross-module lookup без FK)
   *
   * @throws BadRequestException — если endsAt <= startsAt
   * @throws NotFoundException — если clientId не найден
   */
  async createTrip(input: CreateTripInput): Promise<{ tripId: string }> {
    if (input.endsAt.getTime() <= input.startsAt.getTime()) {
      throw new BadRequestException('endsAt должен быть позже startsAt');
    }

    const client = await this.prisma.client.findUnique({
      where: { id: input.clientId },
      select: { id: true },
    });
    if (!client) {
      throw new NotFoundException(`Client не найден: ${input.clientId}`);
    }

    const tripId = await this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          clientId: input.clientId,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          region: input.region,
          ...(input.totalAmount !== undefined ? { totalAmount: input.totalAmount } : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          createdBy: input.createdBy,
          // status default = 'draft' в схеме
        },
        select: { id: true, region: true, startsAt: true, endsAt: true },
      });

      await this.outbox.add(tx, {
        type: 'trips.created',
        schemaVersion: 1,
        actor: { type: 'user', id: input.createdBy },
        payload: {
          tripId: trip.id,
          clientId: input.clientId,
          createdBy: input.createdBy,
          region: trip.region,
          startsAt: trip.startsAt.toISOString(),
          endsAt: trip.endsAt.toISOString(),
        },
      });

      return trip.id;
    });

    this.logger.log(
      { tripId, clientId: input.clientId, createdBy: input.createdBy },
      'trips.created',
    );
    return { tripId };
  }

  /**
   * GET /trips/me — список trip'ов с фильтром по роли (#361):
   * - client → only Trip.clientId == own client_id
   * - manager → only Trip.createdBy == self user_id
   * - admin / concierge / finance → все
   * - guide → пока ничего (нет Trip.guideId attribution)
   *
   * Сортировка: startsAt DESC (свежие сверху).
   */
  async listForUser(userId: string, role: UserRole): Promise<Trip[]> {
    if (role === 'admin' || role === 'concierge' || role === 'finance') {
      return this.prisma.trip.findMany({
        orderBy: { startsAt: 'desc' },
        take: 100,
      });
    }

    if (role === 'manager') {
      return this.prisma.trip.findMany({
        where: { createdBy: userId },
        orderBy: { startsAt: 'desc' },
        take: 100,
      });
    }

    if (role === 'client') {
      const client = await this.prisma.client.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!client) return [];
      return this.prisma.trip.findMany({
        where: { clientId: client.id },
        orderBy: { startsAt: 'desc' },
        take: 100,
      });
    }

    // guide — не имеет trip-attribution в текущей schema
    return [];
  }

  /**
   * GET /trips/:id — детали одной trip с RBAC.
   * Возвращает Trip + bookings count + флаг hasPublishedItinerary.
   */
  async findById(
    userId: string,
    role: UserRole,
    tripId: string,
  ): Promise<{
    trip: Trip;
    bookingsCount: number;
    hasPublishedItinerary: boolean;
  }> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        _count: { select: { bookings: true } },
      },
    });
    if (!trip) {
      throw new NotFoundException('Trip не найден');
    }

    // RBAC
    if (role === 'admin' || role === 'concierge' || role === 'finance') {
      // Полный доступ
    } else if (role === 'manager') {
      if (trip.createdBy !== userId) {
        throw new ForbiddenException('Нет доступа: trip создан другим manager');
      }
    } else if (role === 'client') {
      const client = await this.prisma.client.findUnique({
        where: { userId },
        select: { id: true },
      });
      // findUnique({where:{userId}}) гарантирует client.userId === userId,
      // проверяем только что trip принадлежит этому Client.
      if (client?.id !== trip.clientId) {
        throw new ForbiddenException('Нет доступа к чужому trip');
      }
    } else {
      // guide и прочее
      throw new ForbiddenException('Нет доступа');
    }

    const publishedItinerary = await this.prisma.itinerary.findFirst({
      where: { tripId, publishedAt: { not: null } },
      select: { id: true },
    });

    const { _count, ...tripData } = trip;
    return {
      trip: tripData,
      bookingsCount: _count.bookings,
      hasPublishedItinerary: publishedItinerary !== null,
    };
  }
}
