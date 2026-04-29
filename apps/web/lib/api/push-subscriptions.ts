/**
 * Push subscriptions list/delete API client (#163 phase 2).
 *
 * GET    /comm/push/subscriptions   — активные устройства user'а (без endpoint/keys для privacy)
 * DELETE /comm/push/subscribe       — отписать конкретное устройство
 */
import { apiClient } from './client';

export type PushPlatform = 'web' | 'ios_native' | 'android_native';

export interface PushSubscriptionItem {
  id: string;
  platform: PushPlatform;
  deviceLabel: string | null;
  lastSeenAt: string | null;
  createdAt: string;
}

export async function listPushSubscriptions(): Promise<{ items: PushSubscriptionItem[] }> {
  const res = await apiClient.get<{ items: PushSubscriptionItem[] }>('/comm/push/subscriptions');
  return res.data;
}

export async function unsubscribePushById(subscriptionId: string): Promise<void> {
  await apiClient.delete('/comm/push/subscribe', {
    data: { subscriptionId },
  });
}
