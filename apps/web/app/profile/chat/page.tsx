'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { listThreads, type ChatThread } from '@/lib/api/chat';
import { useCurrentUser } from '@/lib/auth/store';

/**
 * /profile/chat — список threads (#A-10).
 *
 * Polling 10s через setInterval (без WebSocket — phase 4).
 * Pause при невидимом tab через document.visibilityState.
 */

const POLL_MS = 10_000;

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(d);
  }
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(d);
}

function threadTitle(thread: ChatThread): string {
  if (thread.kind === 'client_concierge') return 'Concierge';
  if (thread.kind === 'client_guide') return 'Гид';
  return thread.kind;
}

export default function ChatThreadsPage(): React.ReactElement {
  const user = useCurrentUser();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function load(showSpinner = false): Promise<void> {
      if (showSpinner) setLoading(true);
      try {
        const data = await listThreads();
        if (!cancelled) {
          setThreads(data.items);
          setError(null);
        }
      } catch {
        if (!cancelled && showSpinner) {
          setError('Не удалось загрузить чаты.');
        }
      } finally {
        if (!cancelled && showSpinner) setLoading(false);
      }
    }

    void load(true);

    function startPolling(): void {
      if (timer) return;
      timer = setInterval(() => void load(false), POLL_MS);
    }
    function stopPolling(): void {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function onVisibility(): void {
      if (document.visibilityState === 'visible') {
        void load(false);
        startPolling();
      } else {
        stopPolling();
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
      if (document.visibilityState === 'visible') startPolling();
    }

    return () => {
      cancelled = true;
      stopPolling();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, [user]);

  if (user === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-medium">Сообщения</h1>
        <p className="mt-4 text-muted-foreground">
          Войдите чтобы открыть чаты.{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Войти →
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12 sm:py-16">
      <header>
        <Link
          href="/profile"
          className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          ← Личный кабинет
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          Сообщения
        </h1>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : threads.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Чаты появятся, когда менеджер добавит вас в обсуждение поездки.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`/profile/chat/${t.id}`}
                className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-primary/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-medium">{threadTitle(t)}</h2>
                    {t.unreadCount && t.unreadCount > 0 ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        {t.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  {t.lastMessageBody ? (
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {t.lastMessageBody}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm italic text-muted-foreground">Сообщений пока нет</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(t.lastMessageAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
