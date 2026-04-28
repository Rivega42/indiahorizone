/**
 * TripStatusScheduler — time-based auto-transitions (#160 cron).
 *
 * Каждые 15 минут:
 * 1. paid → in_progress: если startsAt <= now (поездка началась)
 * 2. in_progress → completed: если endsAt < now (поездка закончилась)
 *
 * Idempotent — если transition уже произошёл (manual или раньше),
 * service.transition вернёт BadRequestException; ловим silently.
 *
 * Single-instance assumption: предполагается ОДИН api-инстанс в фазе 3.
 * При scale-out (фаза 4) — leader-election через Redis lock или вынос
 * scheduler'а в отдельный worker.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { TripStatusService } from './trip-status.service';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class TripStatusScheduler {
  private readonly logger = new Logger(TripStatusScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly status: TripStatusService,
  ) {}

  /**
   * Каждые 15 минут — проверяем trips на time-based transitions.
   * 15 мин достаточно для нашего use-case (turnaround по часам, не по минутам).
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async tick(): Promise<void> {
    const now = new Date();
    let started = 0;
    let completed = 0;

    // 1. paid → in_progress (поездка началась)
    const toStart = await this.prisma.trip.findMany({
      where: {
        status: 'paid',
        startsAt: { lte: now },
      },
      select: { id: true },
      take: 100,
    });

    for (const trip of toStart) {
      try {
        await this.status.transition(
          trip.id,
          'in_progress',
          'time-started',
          SYSTEM_USER_ID,
          `auto: startsAt <= ${now.toISOString()}`,
        );
        started++;
      } catch (err) {
        // Concurrent transition или невалидный — silent skip
        this.logger.debug({ tripId: trip.id, err }, 'auto-start.skip');
      }
    }

    // 2. in_progress → completed (поездка закончилась)
    const toComplete = await this.prisma.trip.findMany({
      where: {
        status: 'in_progress',
        endsAt: { lt: now },
      },
      select: { id: true },
      take: 100,
    });

    for (const trip of toComplete) {
      try {
        await this.status.transition(
          trip.id,
          'completed',
          'time-ended',
          SYSTEM_USER_ID,
          `auto: endsAt < ${now.toISOString()}`,
        );
        completed++;
      } catch (err) {
        this.logger.debug({ tripId: trip.id, err }, 'auto-complete.skip');
      }
    }

    if (started > 0 || completed > 0) {
      this.logger.log({ started, completed }, 'trip-status.scheduler.tick');
    }
  }
}
