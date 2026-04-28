/**
 * robots.txt (#308) — Next.js metadata API.
 *
 * Сейчас: разрешаем всех ботов на все public-route'ы. /api/*, /login, /register
 * не индексируем (нет SEO-value).
 *
 * Будущее: при появлении staging-домена — disallow для не-prod env'ов через
 * NEXT_PUBLIC_DISABLE_INDEXING=true (отдельный issue для devops).
 */
import type { MetadataRoute } from 'next';

const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://indiahorizone.ru';

export default function robots(): MetadataRoute.Robots {
  // Глобальный kill-switch для preview/staging deploy'ев.
  if (process.env['NEXT_PUBLIC_DISABLE_INDEXING'] === 'true') {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      sitemap: `${SITE_URL}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/login', '/register', '/profile/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
