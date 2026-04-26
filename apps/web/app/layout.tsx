import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { Providers } from '../lib/providers';

import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
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
    <html lang="ru" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
