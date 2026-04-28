/**
 * TripStatusService — управление переходами статусов trip'а (#160).
 *
 * - transition(tripId, to, reason, actor) — атомарный переход с валидацией
 * - Outbox event `trips.status.changed` в той же транзакции
 *
 * Валидации:
 * - Переход разрешён state-machine'ом (см. status-machine.ts)
 * - Trip существует
 * - Caller имеет права (RBAC проверяется в controller'е через @Roles)
 *
 * Race-safety: используем optimistic transition через UPDATE WHERE status = $from.
 * Параллельный transition двумя caller'ами — один из них сработает (count=1),
 * второй вернётся с count=0 и BadRequestException.
 */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  type TransitionReason,
  isAllowedTransition,
} from './status-machine';

import type { TransitionResponse } from './dto/transition.dto';
import type { TripStatus } from '@prisma/client';

@Injectable()
export class TripStatusService {
  private readonly logger = new Logger(TripStatusService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  async transition(
    tripId: string,
    to: TripStatus,
    reason: TransitionReason,
    actorId: string,
    additionalReason?: string,
  ): Promise<TransitionResponse> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, status: true },
    });
    if (!trip) {
      throw new NotFoundException('Trip не найден');
    }

    if (!isAllowedTransition(trip.status, to)) {
      throw new BadRequestException(
        `Переход ${trip.status} → ${to} не разрешён state-machine'ом`,
      );
    }

    const transitionedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Optimistic transition с проверкой текущего status (race-safety).
      const updated = await tx.trip.updateMany({
        where: { id: tripId, status: trip.status },
        data: { status: to },
      });
      if (updated.count === 0) {
        // Параллельный transition уже изменил status — отказываем.
        throw new BadRequestException(
          'Trip status изменился во время transition (concurrent update)',
        );
      }

      await this.outbox.add(tx, {
        type: 'trips.status.changed',
        schemaVersion: 1,
        actor: { type: 'user', id: actorId },
        payload: {
          tripId,
          from: trip.status,
          to,
          reason,
          ...(additionalReason ? { additionalReason } : {}),
          transitionedAt: transitionedAt.toISOString(),
        },
      });
    });

    this.logger.log(
      { tripId, from: trip.status, to, reason, actorId },
      'trips.status.changed',
    );

    return {
      tripId,
      from: trip.status,
      to,
      transitionedAt,
    };
  }
}
