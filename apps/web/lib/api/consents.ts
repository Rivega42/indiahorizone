/**
 * Consents API client (#A-06).
 *
 * GET    /clients/me/consents              — все consent-записи (active + history)
 * POST   /clients/me/consents/:type        — grant (создать активный)
 * DELETE /clients/me/consents/:type        — revoke активный
 *
 * Типы: photo_video | geo | emergency_contacts | marketing.
 */
import { apiClient } from './client';

export type ConsentType = 'photo_video' | 'geo' | 'emergency_contacts' | 'marketing';

export interface Consent {
  id: string;
  clientId: string;
  type: ConsentType;
  /** "1.2" — версия текста на момент grant'а */
  version: string;
  grantedAt: string;
  revokedAt: string | null;
  context: Record<string, unknown> | null;
  createdAt: string;
}

export async function listConsents(): Promise<Consent[]> {
  const res = await apiClient.get<Consent[]>('/clients/me/consents');
  return res.data;
}

export interface GrantConsentPayload {
  /** SemVer версия текста, на который соглашаемся */
  version: string;
  /** опциональный контекст: where_granted, ip и т.п. */
  context?: Record<string, unknown>;
}

export async function grantConsent(
  type: ConsentType,
  payload: GrantConsentPayload,
): Promise<Consent> {
  const res = await apiClient.post<Consent>(`/clients/me/consents/${type}`, payload);
  return res.data;
}

export async function revokeConsent(type: ConsentType): Promise<void> {
  await apiClient.delete(`/clients/me/consents/${type}`);
}

/**
 * Возвращает map активных согласий по типам.
 * Активный = grantedAt && !revokedAt && самый свежий.
 */
export function getActiveConsents(consents: Consent[]): Map<ConsentType, Consent> {
  const active = new Map<ConsentType, Consent>();
  for (const c of consents) {
    if (c.revokedAt) continue;
    const existing = active.get(c.type);
    if (!existing || new Date(c.grantedAt) > new Date(existing.grantedAt)) {
      active.set(c.type, c);
    }
  }
  return active;
}
