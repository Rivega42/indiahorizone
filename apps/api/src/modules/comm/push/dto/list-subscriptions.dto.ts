import type { PushPlatform } from '@prisma/client';

/**
 * Public DTO для GET /comm/push/subscriptions.
 *
 * Privacy: НЕ возвращаем endpoint и keys (p256dh / auth) — endpoint per-device
 * potentially PII (раскрывает FCM/APNs ID), а keys пользователю не нужны для UI
 * "ваши устройства". Только id + platform + deviceLabel + timestamps.
 */
export interface PushSubscriptionListItemDto {
  id: string;
  platform: PushPlatform;
  /** Human-readable метка ("iOS Safari", "Chrome Desktop"). NULL если не задана. */
  deviceLabel: string | null;
  /** Когда последний раз успешно доставился push (NULL = ни разу). */
  lastSeenAt: string | null; // ISO
  createdAt: string; // ISO
}
