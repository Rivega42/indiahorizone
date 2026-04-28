/**
 * FeedbackService — daily feedback клиента (#188).
 *
 * POST /feedback   — клиент пишет (text + mood [+ circle media])
 * GET  /trips/:id/feedbacks — клиент / concierge / manager / admin читают
 *
 * Access control:
 * - POST: только клиент trip'а (Trip.clientId соответствует user'а Client)
 * - GET: client (own trips) + concierge + manager + admin (все)
 *
 * Idempotency-Key (header) на POST: Redis-cached, TTL 24h (как в chat).
 *
 * Уникальность (trip_id, day_number) гарантируется БД. При попытке повторного
 * POST на тот же день — 409 Conflict (отдельный issue для PATCH-обновления).
 *
 * Outbox event `feedback.received` — для AI-enrichment (#189) и аналитики.
 */
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { OutboxService } from '../../common/outbox/outbox.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

import type { CreateFeedbackDto } from './dto/feedback.dto';
import type { Feedback, UserRole } from '@prisma/client';

const IDEMPOTENCY_TTL_SEC = 24 * 60 * 60;
const PRISMA_UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly redis: RedisService,
  ) {}

  async create(userId: string, dto: CreateFeedbackDto, idempotencyKey: string): Promise<Feedback> {
    // Access: только клиент собственной trip'ы
    await this.assertClientOwnsTrip(userId, dto.tripId);

    // Replay protection через Idempotency-Key
    const idemKey = this.idempotencyKey(userId, dto.tripId, idempotencyKey);
    const cached = await this.redis.getClient().get(idemKey);
    if (cached) {
      const existing = await this.prisma.feedback.findUnique({
        where: { id: cached },
      });
      if (existing) {
        return existing;
      }
    }

    let feedback: Feedback;
    try {
      feedback = await this.prisma.$transaction(async (tx) => {
        // Если был FeedbackRequest на этот день — линкуем.
        const request = await tx.feedbackRequest.findUnique({
          where: { tripId_dayNumber: { tripId: dto.tripId, dayNumber: dto.dayNumber } },
          select: { id: true },
        });

        const created = await tx.feedback.create({
          data: {
            tripId: dto.tripId,
            dayNumber: dto.dayNumber,
            type: dto.type,
            body: dto.body,
            mood: dto.mood,
            ...(dto.mediaId !== undefined ? { mediaId: dto.mediaId } : {}),
            ...(request ? { requestId: request.id } : {}),
          },
        });

        await this.outbox.add(tx, {
          type: 'feedback.received',
          schemaVersion: 1,
          actor: { type: 'user', id: userId },
          payload: {
            feedbackId: created.id,
            tripId: dto.tripId,
            dayNumber: dto.dayNumber,
            mood: dto.mood,
            // body/mediaId НЕ публикуем — потенциально ПДн или sensitive content
            hasMedia: dto.mediaId !== undefined,
            type: dto.type,
          },
        });

        return created;
      });
    } catch (err) {
      // Unique violation на (trip_id, day_number) — уже есть feedback на этот день.
      if (
        err instanceof Error &&
        'code' in err &&
        (err as { code?: string }).code === PRISMA_UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          `Feedback на день ${dto.dayNumber} уже существует. Для обновления — PATCH /feedback/:id`,
        );
      }
      throw err;
    }

    await this.redis.getClient().set(idemKey, feedback.id, 'EX', IDEMPOTENCY_TTL_SEC);

    this.logger.log(
      { feedbackId: feedback.id, tripId: dto.tripId, mood: dto.mood },
      'feedback.received',
    );

    return feedback;
  }

  async listByTrip(userId: string, role: UserRole, tripId: string): Promise<Feedback[]> {
    await this.assertReadAccess(userId, role, tripId);

    return this.prisma.feedback.findMany({
      where: { tripId },
      orderBy: { dayNumber: 'asc' },
    });
  }

  // ─── access helpers ───

  /**
   * Только клиент-владелец trip'а может писать feedback.
   * Trip.clientId = Client.id, Client.userId = User.id.
   */
  private async assertClientOwnsTrip(userId: string, tripId: string): Promise<void> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        clientId: true,
      },
    });
    if (!trip) {
      throw new NotFoundException('Trip не найден');
    }

    const client = await this.prisma.client.findUnique({
      where: { id: trip.clientId },
      select: { userId: true },
    });
    if (client?.userId !== userId) {
      throw new ForbiddenException('Только клиент-владелец может оставлять feedback');
    }
  }

  /**
   * Чтение feedback'ов trip'а:
   * - client → только own trip
   * - concierge / manager / admin / finance → любой trip
   * - guide → только trips где он guide (нет такого FK сейчас; TODO когда добавим)
   */
  private async assertReadAccess(userId: string, role: UserRole, tripId: string): Promise<void> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { clientId: true },
    });
    if (!trip) {
      throw new NotFoundException('Trip не найден');
    }

    if (role === 'admin' || role === 'concierge' || role === 'manager' || role === 'finance') {
      return; // Полный read-доступ к feedback'ам всех trip'ов.
    }

    if (role === 'client') {
      const client = await this.prisma.client.findUnique({
        where: { id: trip.clientId },
        select: { userId: true },
      });
      if (client?.userId !== userId) {
        throw new ForbiddenException('Нет доступа к feedback');
      }
      return;
    }

    // guide — пока без attribution к trip'у (отдельный issue, когда будет
    // Trip.guideId или TripGuide-связь).
    throw new ForbiddenException('Нет доступа к feedback');
  }

  private idempotencyKey(userId: string, tripId: string, key: string): string {
    return `feedback-idem:${userId}:${tripId}:${key}`;
  }
}
