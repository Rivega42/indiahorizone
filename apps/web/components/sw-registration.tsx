'use client';

import { useEffect } from 'react';

/**
 * Регистрирует Service Worker при mount'е root layout (#122).
 *
 * Только в production (NEXT_PUBLIC_ENABLE_SW=true) — в dev SW мешает hot-reload'у
 * Next.js, потому что cache'ит старые chunks. Включается явно через env.
 *
 * Update strategy: SW автоматически проверяет updateViaCache на каждый
 * navigation; при детекции новой версии — устанавливает на background,
 * следующий reload поднимет новую.
 */
export function ServiceWorkerRegistration(): null {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Включаем SW только если явно задано в env (prod-build).
    // В dev — мешает HMR.
    if (process.env['NEXT_PUBLIC_ENABLE_SW'] !== 'true') return;

    void navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.warn('[sw] registration failed', err);
      });
  }, []);

  return null;
}
