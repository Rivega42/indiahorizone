/**
 * Notification preferences API client (#166).
 *
 * GET    /comm/preferences          — все 4 категории с дефолтами + кастомизацией
 * PATCH  /comm/preferences/:cat     — обновить enabled/channels для категории
 *
 * Категории: trips | marketing | sos | system. SOS — protected (server вернёт 400 если попытаться отключить).
 * Каналы: push | email | sms | telegram.
 */
import { apiClient } from './client';

export type NotificationCategory = 'trips' | 'marketing' | 'sos' | 'system';
export type NotificationChannel = 'push' | 'email' | 'sms' | 'telegram';

export interface PreferenceItem {
  category: NotificationCategory;
  channels: NotificationChannel[];
  enabled: boolean;
  /** true = пользователь явно настраивал, false = используется default */
  isCustom: boolean;
}

export async function listPreferences(): Promise<{ items: PreferenceItem[] }> {
  const res = await apiClient.get<{ items: PreferenceItem[] }>('/comm/preferences');
  return res.data;
}

export interface UpdatePreferencePayload {
  enabled?: boolean;
  channels?: NotificationChannel[];
}

export async function updatePreference(
  category: NotificationCategory,
  payload: UpdatePreferencePayload,
): Promise<PreferenceItem> {
  const res = await apiClient.patch<PreferenceItem>(`/comm/preferences/${category}`, payload);
  return res.data;
}
