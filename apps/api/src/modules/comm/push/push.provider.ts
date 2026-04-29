/**
 * PushProvider — абстракция доставки push-payload на конкретную subscription
 * (#163).
 *
 * Аналогично EmailProvider: сейчас один LogPushProvider (no-op + лог) — после
 * получения VAPID keys (#353) подключаем WebPushProvider через `web-push` npm.
 *
 * deliver() — best-effort. Возвращает result, не throw'ит — caller (NotifyService)
 * сам решает что делать с failures (retry / mark subscription dead).
 *
 * Обработка expired subscription: при HTTP 410 Gone от endpoint браузера —
 * subscription больше не валидна, нужно soft-delete'нуть. Returns
 * `{ ok: false, expired: true }`.
 */
import type { PushPlatform } from '@prisma/client';

export interface PushDeliverPayload {
  title: string;
  body: string;
  /** URL который откроется при клике на нотификацию. */
  url?: string;
  /** Для группировки в бровзере (один tag → одна notification, не стек). */
  tag?: string;
  /**
   * Web Push urgency hint (RFC 8030 §5.3):
   * - `normal` (default) — обычная нотификация (поездка стартовала, чат)
   * - `high` — критичная (SOS ack, отмена поездки) — push-сервер пытается доставить
   *   быстрее даже на устройстве в режиме энергосбережения
   *
   * Apple Web Push на iOS особенно чувствителен — `high` обходит throttling, но
   * злоупотребление может привести к downgrade'у нашего sender-rep'а у Apple.
   * Использовать ТОЛЬКО для action-required (SOS, finance refund failure).
   */
  urgency?: 'normal' | 'high';
}

export interface PushSubscriptionTarget {
  id: string;
  platform: PushPlatform;
  endpoint: string;
  /** Web Push only. Для native — null. */
  p256dh?: string | null;
  auth?: string | null;
}

export interface PushDeliverResult {
  ok: boolean;
  /**
   * true → subscription больше не валидна (HTTP 410 Gone). Caller должен
   * soft-delete'нуть запись чтобы не пытаться доставить туда снова.
   */
  expired?: boolean;
  /** Понятная причина для логов / outbox event'а. */
  reason?: string;
}

export interface PushProvider {
  deliver(target: PushSubscriptionTarget, payload: PushDeliverPayload): Promise<PushDeliverResult>;
}

export const PUSH_PROVIDER = Symbol('PUSH_PROVIDER');
