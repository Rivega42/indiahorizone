/**
 * Tour catalog API client. Читает данные с backend (NestJS catalog-module #296).
 *
 * Стратегия: пытается fetch на NEXT_PUBLIC_API_URL/tours, при любой ошибке
 * (network / 4xx / 5xx) возвращает fallback из mock'а. Это позволяет:
 * 1. Билдить frontend без backend на build-time (Vercel-like envs)
 * 2. Сохранять страницу работоспособной если backend недоступен
 * 3. Постепенно мигрировать с mock на real-api по мере готовности backend
 *
 * Как только бэкенд стабильно живёт — fallback убираем и оставляем только fetch.
 *
 * Issue: backend integration phase EPIC 12.
 */

import {
  KERALA_TOUR,
  listToursSlugs as listMockSlugs,
  TOURS_BY_SLUG as MOCK_TOURS_BY_SLUG,
  type Tour,
} from '../mock/tours';

const API_URL = process.env['NEXT_PUBLIC_API_URL'];

/**
 * Хелпер с timeout — fetch без timeout вешается на 30+ секунд при сетевых
 * проблемах, что разрушит build (generateStaticParams).
 */
async function fetchWithTimeout(url: string, ms = 3000): Promise<Response | null> {
  if (API_URL == null || API_URL.length === 0) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timer);
    return res;
  } catch {
    return null;
  }
}

/**
 * Найти тур по slug. Сначала API, затем fallback на mock.
 */
export async function getTourBySlug(slug: string): Promise<Tour | null> {
  const res = await fetchWithTimeout(`${API_URL}/tours/${encodeURIComponent(slug)}`);
  if (res?.ok) {
    try {
      const data = (await res.json()) as Tour;
      return data;
    } catch {
      /* falls through to mock */
    }
  }
  return MOCK_TOURS_BY_SLUG[slug] ?? null;
}

/**
 * Список slug'ов для generateStaticParams. Используется в build-time —
 * timeout важен, иначе build виснет.
 */
export async function listTourSlugs(): Promise<string[]> {
  const res = await fetchWithTimeout(`${API_URL}/tours`, 3000);
  if (res?.ok) {
    try {
      const data = (await res.json()) as { slug: string }[];
      if (data.length > 0) return data.map((t) => t.slug);
    } catch {
      /* falls through to mock */
    }
  }
  return listMockSlugs();
}

export type { Tour };
export { KERALA_TOUR };
