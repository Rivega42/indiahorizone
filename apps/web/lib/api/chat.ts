/**
 * Chat API client (#A-10).
 *
 * GET    /chat/threads
 * GET    /chat/threads/:id/messages?limit=&cursor=
 * POST   /chat/threads/:id/messages   (Idempotency-Key обязателен)
 * POST   /chat/threads/:id/read
 *
 * Idempotency-Key — UUID v4 на каждое сообщение. При retry (плохая сеть)
 * с тем же ключом backend вернёт оригинальное сообщение → нет дубликатов.
 */
import { apiClient } from './client';

export interface ChatThread {
  id: string;
  /** "client_concierge" | "client_guide" — тип треда */
  kind: string;
  participants: string[];
  unreadCount?: number;
  lastMessageAt: string | null;
  lastMessageBody: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  attachments: string[];
  createdAt: string;
  readBy: string[];
}

export async function listThreads(): Promise<{ items: ChatThread[] }> {
  const res = await apiClient.get<{ items: ChatThread[] }>('/chat/threads');
  return res.data;
}

export interface ListMessagesResponse {
  items: ChatMessage[];
  nextCursor: string | null;
}

export async function listMessages(
  threadId: string,
  opts: { limit?: number; cursor?: string } = {},
): Promise<ListMessagesResponse> {
  const params = new URLSearchParams();
  if (opts.limit !== undefined) params.set('limit', String(opts.limit));
  if (opts.cursor) params.set('cursor', opts.cursor);
  const qs = params.toString();
  const url = `/chat/threads/${threadId}/messages${qs ? `?${qs}` : ''}`;
  const res = await apiClient.get<ListMessagesResponse>(url);
  return res.data;
}

export interface SendMessagePayload {
  body: string;
  attachments?: string[];
}

export async function sendMessage(
  threadId: string,
  payload: SendMessagePayload,
  idempotencyKey: string,
): Promise<ChatMessage> {
  const res = await apiClient.post<ChatMessage>(`/chat/threads/${threadId}/messages`, payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return res.data;
}

export async function markRead(threadId: string): Promise<{ updated: number }> {
  const res = await apiClient.post<{ updated: number }>(`/chat/threads/${threadId}/read`);
  return res.data;
}

/**
 * Генерирует UUID v4 для Idempotency-Key.
 * Используем crypto.randomUUID() (доступен в Node 19+ и современных браузерах).
 */
export function newIdempotencyKey(): string {
  return globalThis.crypto.randomUUID();
}
