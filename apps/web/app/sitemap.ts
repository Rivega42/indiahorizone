/**
 * sitemap.xml (#308) — Next.js metadata API.
 *
 * Перечисляет все индексируемые URL'ы для Яндекс/Google ботов.
 * Туры подтягиваются из catalog API через listTourSlugs() (тот же канал,
 * что и generateStaticParams в /tours/[slug]/page.tsx).
 *
 * lastModified: используем `new Date()` — Яндекс/Google понимают это как
 * «обновлено в момент последнего ре-генерации». ISR обновляет sitemap
 * раз в час (revalidate=3600 наследуется от parent).
 *
 * priority — относительный сигнал: главная 1.0, туры 0.8, юр.документы 0.3.
 * changeFrequency — подсказка ботам, как часто чекать.
 */
import type { MetadataRoute } from 'next';

import { listTourSlugs } from '@/lib/api/tours';

const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://indiahorizone.ru';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listTourSlugs();
  const now = new Date();

  const tourEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${SITE_URL}/tours/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/tours`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...tourEntries,
  ];
}
