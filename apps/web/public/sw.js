/**
 * Service Worker — app-shell cache + push handler (#122).
 *
 * V1 strategy:
 * - install: precache app-shell (static html + critical assets)
 * - fetch: network-first для /api/*, cache-first для /icons/* и static
 * - push: показывает notification из payload (#163 push handler)
 * - notificationclick: openWindow → URL из notification.data
 *
 * Полная offline-cache стратегия (IndexedDB через Dexie для /trips data) —
 * Slice D (#157), не в этом PR.
 *
 * Версионирование: меняем CACHE_NAME при breaking-change cache-стратегии,
 * старые caches удаляются в activate.
 */

/* eslint-disable no-restricted-globals, @typescript-eslint/no-undef */

const CACHE_NAME = 'indiahorizone-v1';
const PRECACHE_URLS = ['/', '/icons/icon-192.svg', '/icons/icon-512.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET и cross-origin (api запросы идут на http://2.56.241.126:3011)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // API requests — network-only (всегда свежие данные, без cache surprises)
  if (url.pathname.startsWith('/api/')) {
    return; // default browser handling
  }

  // Static assets (icons, images) — cache-first
  if (url.pathname.startsWith('/icons/') || url.pathname.match(/\.(svg|png|jpg|webp|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request)),
    );
    return;
  }

  // App-shell (HTML pages) — network-first с cache-fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
  );
});

/**
 * Push handler (#163) — показывает notification из payload server'а.
 *
 * Server шлёт через web-push npm с такой структурой:
 *   { title: 'Новое сообщение', body: 'Концьерж ответил вам', url: '/chat/...' }
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'IndiaHorizone', body: event.data.text() };
  }

  const title = payload.title || 'IndiaHorizone';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    data: payload.url || '/',
    tag: payload.tag,
    renotify: payload.tag ? true : false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Если уже открыт tab с нашим origin — фокусим его и навигируем
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Иначе открываем новый
      return self.clients.openWindow(url);
    }),
  );
});
