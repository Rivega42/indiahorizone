/**
 * Web App Manifest (#122) — для PWA install + iOS Add-to-Home-Screen.
 *
 * Next.js 14 metadata API: файл manifest.ts автоматически отдаётся
 * на `/manifest.webmanifest` с правильным Content-Type.
 *
 * Icons:
 * - SVG-based (иконки в public/icons/) — поддерживаются Chrome/Edge/Firefox/Safari macOS
 * - iOS Safari требует PNG для apple-touch-icon, но они подключаются через
 *   metadata.icons в layout.tsx (отдельно от webmanifest)
 *
 * Important для iOS push (#163, #356):
 * - display: 'standalone' — обязательно для Web Push на iOS 16.4+
 * - icons с purpose: 'maskable' для Android adaptive icons
 *
 * См. также docs/ARCH/OFFLINE.md для cache strategy в Slice D.
 */
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IndiaHorizone — Trip Dashboard',
    short_name: 'IndiaHorizone',
    description:
      'Tech-enabled India concierge для русскоязычных путешественников. Персональные поездки в Индию с локальной поддержкой и сопровождением.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7f4ee',
    theme_color: '#e07a3c',
    lang: 'ru',
    dir: 'ltr',
    categories: ['travel', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
