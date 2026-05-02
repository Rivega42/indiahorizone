'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { authApi, type SessionItem } from '@/lib/auth/api';
import { useCurrentUser } from '@/lib/auth/store';

/**
 * /profile/security/sessions — список активных сессий (#A-05).
 *
 * Каждая сессия: устройство (браузер + ОС), IP, дата создания, expires.
 * Текущая сессия помечена бейджем «Текущая» и не может быть завершена
 * через DELETE /auth/sessions/:id (для этого есть POST /auth/logout).
 *
 * CTA «Выйти со всех устройств» — полный logout-all через POST /auth/logout-all.
 *
 * Auth required. PII (IP) показываем только владельцу.
 */

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatExpires(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'истекла';
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days} дн.`;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 1) return `${hours} ч.`;
  const minutes = Math.max(1, Math.floor(ms / (60 * 1000)));
  return `${minutes} мин.`;
}

export default function SessionsPage(): React.ReactElement {
  const user = useCurrentUser();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [logoutAllPending, setLogoutAllPending] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    authApi
      .listSessions()
      .then((items) => {
        if (!cancelled) setSessions(items);
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить сессии.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleRevoke(sessionId: string): Promise<void> {
    setError(null);
    setRevokingId(sessionId);
    try {
      await authApi.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      setError('Не удалось завершить сессию. Попробуйте ещё раз.');
    } finally {
      setRevokingId(null);
    }
  }

  async function handleLogoutAll(): Promise<void> {
    if (
      !window.confirm(
        'Завершить ВСЕ сессии, включая текущую? Вам потребуется войти заново на всех устройствах.',
      )
    ) {
      return;
    }
    setError(null);
    setLogoutAllPending(true);
    try {
      await authApi.logoutAll();
      // После logout-all access-token сразу инвалидируется; редирект на /login.
      window.location.href = '/login';
    } catch {
      setError('Не удалось завершить все сессии.');
      setLogoutAllPending(false);
    }
  }

  if (user === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-medium">Активные сессии</h1>
        <p className="mt-4 text-muted-foreground">
          Войдите чтобы посмотреть список устройств.{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Войти →
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12 sm:py-16">
      <header>
        <Link
          href="/profile"
          className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          ← Личный кабинет
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          Активные сессии
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Устройства, на которых сейчас выполнен вход. Если видите подозрительную сессию — завершите
          её и смените пароль.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Активных сессий нет.</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((session) => (
            <li key={session.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{session.deviceLabel}</p>
                    {session.current ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-primary">
                        Текущая
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {session.ip ? `IP: ${session.ip}` : 'IP неизвестен'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Вход: {formatDateTime(session.createdAt)} · истекает через{' '}
                    {formatExpires(session.expiresAt)}
                  </p>
                </div>
                {!session.current ? (
                  <button
                    type="button"
                    onClick={() => void handleRevoke(session.id)}
                    disabled={revokingId === session.id}
                    className="shrink-0 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    {revokingId === session.id ? 'Завершение…' : 'Завершить'}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-lg border border-border bg-muted/30 p-5">
        <h2 className="font-medium">Выйти со всех устройств</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Завершит все сессии, включая текущую. После этого нужно будет войти заново.
        </p>
        <button
          type="button"
          onClick={() => void handleLogoutAll()}
          disabled={logoutAllPending}
          className="mt-3 rounded-lg border border-destructive/30 bg-background px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          {logoutAllPending ? 'Завершение…' : 'Выйти со всех устройств'}
        </button>
      </div>
    </main>
  );
}
