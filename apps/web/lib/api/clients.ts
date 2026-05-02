/**
 * Clients API client (#A-01, #A-02).
 *
 * GET   /clients/me — профиль клиента + расшифрованные ПДн
 * PATCH /clients/me — обновить поля профиля (diff-only)
 *
 * Профиль создаётся через listener на `auth.user.registered` событие.
 * Edge case: register прошёл, но listener ещё не отработал → 404.
 * Frontend показывает skeleton + retry.
 */
import { apiClient } from './client';

export interface ClientProfile {
  id: string;
  clientId: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  citizenship: string | null;
  phone: string | null;
  telegramHandle: string | null;
  preferences: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ClientMe {
  id: string;
  userId: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  profile: ClientProfile | null;
}

export async function getMe(): Promise<ClientMe> {
  const res = await apiClient.get<ClientMe>('/clients/me');
  return res.data;
}

/**
 * Patch-семантика: omitted поле = нет изменений, явный null = очистить.
 * Шифрование ПДн (firstName/lastName/dateOfBirth/phone) на бэке прозрачно.
 */
export interface UpdateClientProfilePatch {
  firstName?: string | null;
  lastName?: string | null;
  /** ISO date YYYY-MM-DD */
  dateOfBirth?: string | null;
  /** ISO 3166-1 alpha-2 (RU, IN, ...) */
  citizenship?: string | null;
  /** E.164 phone: +<10-15 digits> */
  phone?: string | null;
  /** Telegram handle без @ (5–32 chars, latin/digits/underscore) */
  telegramHandle?: string | null;
  preferences?: Record<string, unknown>;
}

export async function updateMe(patch: UpdateClientProfilePatch): Promise<ClientProfile> {
  const res = await apiClient.patch<ClientProfile>('/clients/me', patch);
  return res.data;
}
