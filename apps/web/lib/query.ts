import { QueryClient } from '@tanstack/react-query';

/**
 * Создаёт QueryClient с дефолтами IndiaHorizone.
 *
 * - staleTime 5 мин — для оффлайн-friendly UX (данные считаются свежими 5 минут,
 *   за это время offline cache работает без warning'а)
 * - retry: 1 для queries (избегаем retry-storm на 5xx); mutations не ретраим автоматически
 *   (idempotency-key через каждый POST в #221)
 * - refetchOnWindowFocus: false (раздражает в travel-сценариях)
 * - networkMode: 'offlineFirst' — для PWA (#122 service worker подхватит)
 *
 * Соответствует docs/ARCH/OFFLINE.md § Pull (server → client).
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        networkMode: 'offlineFirst',
      },
      mutations: {
        retry: 0,
        networkMode: 'online',
      },
    },
  });
}
