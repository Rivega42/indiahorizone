/**
 * TripStatus state-machine (#160).
 *
 * Allowed transitions:
 *
 *   draft ──┬──► paid ──► in_progress ──► completed
 *           │      │              │
 *           └──────┴──────────────┴────► cancelled (anywhere)
 *
 * Любая попытка перехода вне этой матрицы → BadRequestException.
 *
 * Triggers:
 * - draft → paid: PATCH /trips/:id/status (admin/manager) ИЛИ
 *   listener на finance.payment.received (когда finance модуль будет готов)
 * - paid → in_progress: scheduled cron при startsAt <= now (V2, отдельный issue)
 *   или manual PATCH (для testing)
 * - in_progress → completed: cron при endsAt < now (V2)
 *   или manual PATCH
 * - * → cancelled: manual PATCH (admin/manager) с reason
 *
 * Critical: state machine с explicit transitions защищает от того что год
 * спустя кто-то напишет `status = 'completed'` из произвольного места и
 * сломает аналитику NPS, refund'ов, закрытых-трип-метрик.
 */
import { TripStatus } from '@prisma/client';

const ALLOWED_TRANSITIONS: Readonly<Record<TripStatus, ReadonlyArray<TripStatus>>> = {
  draft: ['paid', 'cancelled'],
  paid: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // финальный
  cancelled: [], // финальный
};

export function isAllowedTransition(from: TripStatus, to: TripStatus): boolean {
  if (from === to) return false; // no-op = invalid
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function getAllowedTransitions(from: TripStatus): ReadonlyArray<TripStatus> {
  return ALLOWED_TRANSITIONS[from];
}

/**
 * Reasoning string для outbox event payload — почему произошёл переход
 * (manual / payment-received / time-based).
 */
export type TransitionReason =
  | 'manual'
  | 'payment-received'
  | 'time-started'
  | 'time-ended'
  | 'cancelled-by-client'
  | 'cancelled-by-manager';
