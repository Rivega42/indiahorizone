import { Inter, Playfair_Display } from 'next/font/google';

import { ServiceWorkerRegistration } from '../components/sw-registration';
import { Providers } from '../lib/providers';

import type { Metadata, Viewport } from 'next';

import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'IndiaHorizone — Trip Dashboard',
    template: '%s | IndiaHorizone',
  },
  description:
    'Tech-enabled India concierge для русскоязычных клиентов: персональные поездки в Индию с локальной поддержкой и сопровождением.',
  applicationName: 'IndiaHorizone',
  authors: [{ name: 'IndiaHorizone' }],
  formatDetection: {
    telephone: false,
  },
  // Apple Touch Icon для iOS «Добавить на главный экран» (#122 + #356)
  icons: {
    icon: [{ url: '/icons/icon-192.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' }],
  },
  // iOS PWA-specific meta — для standalone-режима в Add-to-Home-Screen
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IndiaHorizone',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="ru" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <ServiceWorkerRegistration />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
