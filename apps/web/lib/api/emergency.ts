/**
 * Emergency Contacts API client (#A-07).
 *
 * GET    /clients/me/emergency-contacts        — список (1-2 шт.)
 * POST   /clients/me/emergency-contacts        — upsert (по priority)
 * DELETE /clients/me/emergency-contacts/:id    — удалить
 *
 * PII (имя/телефон) шифруются на бэке через AES-256-GCM. Frontend получает
 * расшифрованные значения (только для владельца профиля).
 */
import { apiClient } from './client';

export type EmergencyContactPriority = 'primary' | 'secondary';

export interface EmergencyContact {
  id: string;
  clientId: string;
  name: string;
  phone: string;
  relation: string;
  /** ISO 639-1: "ru" / "en" / ... */
  language: string;
  priority: EmergencyContactPriority;
  createdAt: string;
  updatedAt: string;
}

export async function listContacts(): Promise<EmergencyContact[]> {
  const res = await apiClient.get<EmergencyContact[]>('/clients/me/emergency-contacts');
  return res.data;
}

export interface UpsertEmergencyContactPayload {
  name: string;
  /** E.164: +<country><10-15 digits> */
  phone: string;
  relation: string;
  /** ISO 639-1, lowercase */
  language: string;
  priority: EmergencyContactPriority;
}

export async function upsertContact(
  payload: UpsertEmergencyContactPayload,
): Promise<EmergencyContact> {
  const res = await apiClient.post<EmergencyContact>('/clients/me/emergency-contacts', payload);
  return res.data;
}

export async function deleteContact(id: string): Promise<void> {
  await apiClient.delete(`/clients/me/emergency-contacts/${id}`);
}
