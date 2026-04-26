'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

import { createQueryClient } from './query';

/**
 * Top-level providers, оборачивающий всё приложение.
 * Используется в app/layout.tsx через RSC-friendly подход:
 * QueryClient создаётся один раз через useState (не реинициализируется
 * между renders) — это рекомендованный pattern для Next.js App Router.
 */
export function Providers({ children }: { children: React.ReactNode }): React.ReactElement {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
