/**
 * Feedback API client (#A-11).
 *
 * POST /feedback              — создать (Idempotency-Key обязателен)
 * GET  /trips/:id/feedbacks   — список feedback'ов поездки (RBAC)
 *
 * Тип feedback'а:
 * - text — обычный текст-фидбэк
 * - circle — видео-кружок (требует mediaId, реализуется в B-05)
 *
 * Mood — 5-балльная emoji-шкала: bad | neutral | ok | good | excellent.
 */
import { newIdempotencyKey } from './chat';
import { apiClient } from './client';

export type FeedbackType = 'text' | 'circle';
export type FeedbackMood = 'bad' | 'neutral' | 'ok' | 'good' | 'excellent';

export interface Feedback {
  id: string;
  tripId: string;
  clientId: string;
  dayNumber: number;
  type: FeedbackType;
  body: string;
  mood: FeedbackMood;
  mediaId: string | null;
  createdAt: string;
}

export interface CreateFeedbackPayload {
  tripId: string;
  dayNumber: number;
  type: FeedbackType;
  body: string;
  mood: FeedbackMood;
  mediaId?: string;
}

export async function createFeedback(payload: CreateFeedbackPayload): Promise<Feedback> {
  const idempotencyKey = newIdempotencyKey();
  const res = await apiClient.post<Feedback>('/feedback', payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return res.data;
}

export async function listTripFeedbacks(tripId: string): Promise<{ items: Feedback[] }> {
  const res = await apiClient.get<{ items: Feedback[] }>(`/trips/${tripId}/feedbacks`);
  return res.data;
}

export const MOOD_EMOJI: Record<FeedbackMood, string> = {
  bad: '😔',
  neutral: '😐',
  ok: '🙂',
  good: '😊',
  excellent: '🤩',
};

export const MOOD_LABEL: Record<FeedbackMood, string> = {
  bad: 'Плохо',
  neutral: 'Нормально',
  ok: 'Неплохо',
  good: 'Хорошо',
  excellent: 'Отлично',
};

export const MOOD_ORDER: FeedbackMood[] = ['bad', 'neutral', 'ok', 'good', 'excellent'];
