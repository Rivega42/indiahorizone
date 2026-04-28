/**
 * TripsService — бизнес-логика модуля trips.
 *
 * Currently:
 * - createTrip (#150) — создание Trip + outbox `trips.created`
 *
 * Будущее (#151+): editor versioning, status transitions, bookings nesting.
 */
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { OutboxService } from '../../common/outbox/outbox.service';
import { PrismaService } from '../../common/prisma/prisma.service';

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
}
