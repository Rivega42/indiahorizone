/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Standalone-output для Docker-deploy (issue #320 [devops:vika]):
  // Next.js собирает минимальный self-contained bundle в .next/standalone/.
  // outputFileTracingRoot — указываем корень monorepo, чтобы tracing подтянул
  // пакеты из pnpm-workspace (packages/shared/dist/).
  output: 'standalone',
  experimental: {
    typedRoutes: true,
    outputFileTracingRoot: new URL('../..', import.meta.url).pathname,
  },
  // next/image — AVIF/WebP auto-conversion, responsive sizes, lazy-load (#309).
  // remotePatterns — whitelist хостов, разрешённых для оптимизации.
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Mock-данные — Unsplash. Удалится когда S3 (#350) подключим, заменим на наш домен.
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // S3 хранилище для production (Beget Object Storage — #350).
      { protocol: 'https', hostname: 's3.ru1.storage.beget.cloud' },
      // CDN если будет (отдельный issue).
      { protocol: 'https', hostname: 'cdn.indiahorizone.ru' },
    ],
  },
};

export default nextConfig;
