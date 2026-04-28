/**
 * PushService — управление push-subscription'ами + доставка (#163).
 *
 * Ответственность:
 * 1. subscribe() — upsert push-subscription для (user, endpoint). Idempotent:
 *    повторная подписка с тем же endpoint обновит keys + lastSeenAt.
 * 2. unsubscribeByEndpoint() — soft-delete subscription'а при logout / опт-аут.
 * 3. listForUser() — для UI «ваши устройства» в личном кабинете (V2).
 * 4. sendToUser() — доставить push на ВСЕ активные subscription'ы user'а через
 *    PushProvider. Failed/expired subscription'ы помечаются deletedAt.
 *
 * Race-safety: upsert по (userId, endpoint) — атомарный. Параллельные
 * subscribe-вызовы из двух tab'ов одного user'а — оба upsert'нутся в одну
 * запись (no race, последний выигрывает по updated_at).
 *
 * Privacy в outbox events: НЕ публикуем endpoint / keys в payload — endpoint
 * уникален per-device и потенциально PII (раскрывает FCM/APNs ID). Только
 * subscriptionId + platform.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';

import { LogPushProvider } from './log-push.provider';
import { PUSH_PROVIDER } from './push.provider';
import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

import type { PushDeliverPayload, PushProvider, PushSubscriptionTarget } from './push.provider';
import type { PushPlatform, PushSubscription } from '@prisma/client';

export interface SubscribeInput {
  userId: string;
  platform: PushPlatform;
  endpoint: string;
  p256dh?: string;
  auth?: string;
  deviceLabel?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    @Inject(PUSH_PROVIDER) private readonly provider: PushProvider,
  ) {}

  /**
   * Подписать (или re-активировать) push для конкретного устройства user'а.
   *
   * Если subscription с таким (userId, endpoint) ранее была soft-deleted —
   * восстанавливаем (deletedAt = null). Это покрывает кейс «пользователь
   * отказался → потом снова разрешил» без накопления мёртвых записей.
   */
  async subscribe(input: SubscribeInput): Promise<{ subscriptionId: string }> {
    const subscription = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.pushSubscription.findUnique({
        where: { userId_endpoint: { userId: input.userId, endpoint: input.endpoint } },
        select: { id: true, deletedAt: true },
      });

      const data = {
        platform: input.platform,
        ...(input.p256dh !== undefined ? { p256dh: input.p256dh } : { p256dh: null }),
        ...(input.auth !== undefined ? { auth: input.auth } : { auth: null }),
        ...(input.deviceLabel !== undefined ? { deviceLabel: input.deviceLabel } : {}),
        deletedAt: null,
      };

      const upserted = existing
        ? await tx.pushSubscription.update({
            where: { id: existing.id },
            data,
            select: { id: true },
          })
        : await tx.pushSubscription.create({
            data: {
              userId: input.userId,
              endpoint: input.endpoint,
              ...data,
            },
            select: { id: true },
          });

      // Outbox event (без endpoint/keys — privacy)
      await this.outbox.add(tx, {
        type: 'comm.push.subscribed',
        schemaVersion: 1,
        actor: { type: 'user', id: input.userId },
        payload: {
          subscriptionId: upserted.id,
          userId: input.userId,
          platform: input.platform,
          reactivated: existing?.deletedAt !== null && existing?.deletedAt !== undefined,
        },
      });

      return upserted;
    });

    this.logger.log(
      { subscriptionId: subscription.id, userId: input.userId, platform: input.platform },
      'comm.push.subscribed',
    );
    return { subscriptionId: subscription.id };
  }

  /**
   * Soft-delete конкретной subscription по endpoint (например, при «отписаться
   * с этого устройства»). Безопасно для idempotency — если её уже нет, no-op.
   */
  async unsubscribeByEndpoint(userId: string, endpoint: string): Promise<{ removed: boolean }> {
    const result = await this.prisma.pushSubscription.updateMany({
      where: { userId, endpoint, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { removed: result.count > 0 };
  }

  /**
   * Активные subscription'ы user'а (для UI «ваши устройства»).
   */
  async listForUser(userId: string): Promise<PushSubscription[]> {
    return this.prisma.pushSubscription.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Доставить push на ВСЕ активные subscription'ы user'а. При expired (410 Gone)
   * — soft-delete subscription и продолжаем с остальными.
   *
   * Best-effort: вернёт {sent, failed, expired} счётчики. Не throw'ит.
   */
  async sendToUser(
    userId: string,
    payload: PushDeliverPayload,
  ): Promise<{ sent: number; failed: number; expired: number }> {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        platform: true,
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });

    let sent = 0;
    let failed = 0;
    let expired = 0;

    for (const sub of subscriptions) {
      const target: PushSubscriptionTarget = {
        id: sub.id,
        platform: sub.platform,
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
      };

      const result = await this.provider.deliver(target, payload);

      if (result.ok) {
        sent += 1;
        await this.prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { lastSeenAt: new Date() },
        });
      } else if (result.expired === true) {
        expired += 1;
        await this.prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { deletedAt: new Date() },
        });
        this.logger.log(
          { subscriptionId: sub.id, userId },
          'comm.push.subscription.expired-removed',
        );
      } else {
        failed += 1;
        this.logger.warn(
          { subscriptionId: sub.id, userId, reason: result.reason },
          'comm.push.deliver.failed',
        );
      }
    }

    return { sent, failed, expired };
  }
}

// Re-export для convenience в module
export { LogPushProvider };
