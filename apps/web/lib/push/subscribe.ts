'use client';

/**
 * Web Push subscription helpers (#356).
 *
 * Отделено от React-хука чтобы можно было вызвать subscribePush() из любого
 * action (кнопка «Включить уведомления», после login, после первого важного
 * события и т.д.).
 *
 * VAPID public key берём из NEXT_PUBLIC_VAPID_PUBLIC_KEY (env). Backend (#163)
 * хранит соответствующий приватный ключ и подписывает push-payloads через
 * web-push npm.
 *
 * POST /comm/push/subscribe — пока не реализован на backend (#163 сейчас не
 * закрыт). До этого момента — fallback на console.log + early-return.
 * Когда backend будет готов, замените `void` на реальный axios-вызов.
 */

import { apiClient, isApiError } from '../api/client';

export interface PushSubscribeResult {
  ok: boolean;
  /** Понятная причина для UI: 'denied' / 'unsupported' / 'network-error' / undefined (ok) */
  reason?: 'denied' | 'unsupported' | 'no-vapid-key' | 'network-error' | 'unknown';
}

/**
 * Конвертация base64url VAPID-ключа в Uint8Array, как требует
 * PushManager.subscribe(applicationServerKey).
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  // Аллоцируем фиксированный ArrayBuffer (а не SharedArrayBuffer) —
  // PushManager.subscribe требует именно ArrayBuffer-backed view.
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i += 1) {
    view[i] = rawData.charCodeAt(i);
  }
  return view;
}

function detectDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || /iPad|iPhone/.test(navigator.platform)) {
    return 'iOS Safari';
  }
  if (ua.includes('Android')) {
    if (ua.includes('Chrome')) return 'Android Chrome';
    return 'Android Browser';
  }
  if (ua.includes('Chrome')) return 'Chrome Desktop';
  if (ua.includes('Firefox')) return 'Firefox Desktop';
  if (ua.includes('Safari')) return 'Safari Desktop';
  return 'Web';
}

/**
 * Запрашивает permission, подписывается на push, отправляет subscription на backend.
 *
 * Возвращает {ok: false, reason: ...} вместо throw — UI может показать
 * понятное сообщение пользователю без try/catch.
 */
export async function subscribePush(): Promise<PushSubscribeResult> {
  if (typeof window === 'undefined') return { ok: false, reason: 'unsupported' };
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }

  const vapidKey = process.env['NEXT_PUBLIC_VAPID_PUBLIC_KEY'];
  if (!vapidKey) {
    console.warn('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY не задан — push не подписан');
    return { ok: false, reason: 'no-vapid-key' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, reason: 'denied' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // обязательно для Apple/Google: каждый push должен показывать видимое уведомление
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    // Backend endpoint #163 пока не существует — отправим, но silent-fail
    // если 404. Когда backend будет готов, удалите try/catch здесь и пусть
    // ошибки всплывают.
    try {
      await apiClient.post('/comm/push/subscribe', {
        platform: 'web',
        token: JSON.stringify(subscription.toJSON()),
        deviceLabel: detectDeviceLabel(),
      });
    } catch (err) {
      // 404 от backend (endpoint ещё не создан) — не блокируем UX, в логах видно
      if (isApiError(err) && err.response?.status === 404) {
        console.warn('[push] backend /comm/push/subscribe ещё не реализован (#163)');
      } else {
        console.error('[push] subscribe POST failed', err);
        return { ok: false, reason: 'network-error' };
      }
    }

    return { ok: true };
  } catch (err) {
    console.error('[push] subscription failed', err);
    return { ok: false, reason: 'unknown' };
  }
}
