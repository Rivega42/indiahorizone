'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  listMessages,
  markRead,
  newIdempotencyKey,
  sendMessage,
  type ChatMessage,
} from '@/lib/api/chat';
import { useCurrentUser } from '@/lib/auth/store';

/**
 * /profile/chat/[id] — конкретный thread (#A-10).
 *
 * - Загружает первую страницу messages (свежие сначала).
 * - Polling 10s.
 * - Send: idempotency-key + optimistic update (pending state).
 * - Mark read при mount + после получения новых.
 */

const POLL_MS = 10_000;

interface PendingMessage {
  tempId: string;
  body: string;
  idempotencyKey: string;
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  );
}

export default function ChatThreadPage(): React.ReactElement {
  const user = useCurrentUser();
  const params = useParams<{ id: string }>();
  const threadId = params?.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(
    async (silent = false): Promise<void> => {
      if (!threadId) return;
      try {
        const data = await listMessages(threadId, { limit: 50 });
        // Backend возвращает items от свежих к старым; для UI разворачиваем.
        const ordered = [...data.items].reverse();
        setMessages(ordered);
        if (!silent) setError(null);
      } catch {
        if (!silent) setError('Не удалось загрузить сообщения.');
      }
    },
    [threadId],
  );

  // Init load + mark read
  useEffect(() => {
    if (!user || !threadId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      await refresh(false);
      if (!cancelled) setLoading(false);
      try {
        await markRead(threadId);
      } catch {
        // не критично
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, threadId, refresh]);

  // Polling + visibility-aware
  useEffect(() => {
    if (!user || !threadId) return undefined;
    let timer: ReturnType<typeof setInterval> | null = null;
    function start(): void {
      if (timer) return;
      timer = setInterval(() => void refresh(true), POLL_MS);
    }
    function stop(): void {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    function onVis(): void {
      if (document.visibilityState === 'visible') {
        void refresh(true);
        start();
      } else {
        stop();
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
      if (document.visibilityState === 'visible') start();
    }
    return () => {
      stop();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }, [user, threadId, refresh]);

  // Auto-scroll на последнее сообщение
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, pending.length]);

  async function handleSend(): Promise<void> {
    if (!threadId) return;
    const body = draft.trim();
    if (!body || sending) return;
    const tempId = `pending-${Date.now()}`;
    const idempotencyKey = newIdempotencyKey();
    const pendingItem: PendingMessage = { tempId, body, idempotencyKey };

    setPending((prev) => [...prev, pendingItem]);
    setDraft('');
    setSending(true);
    setError(null);
    try {
      const sent = await sendMessage(threadId, { body }, idempotencyKey);
      setMessages((prev) => [...prev, sent]);
      setPending((prev) => prev.filter((p) => p.tempId !== tempId));
    } catch {
      setError('Не удалось отправить. Попробуйте ещё раз.');
      // Возвращаем текст в input для retry
      setDraft(body);
      setPending((prev) => prev.filter((p) => p.tempId !== tempId));
    } finally {
      setSending(false);
    }
  }

  if (user === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-medium">Чат</h1>
        <p className="mt-4 text-muted-foreground">
          Войдите чтобы открыть чат.{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Войти →
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main
      className="mx-auto flex max-w-2xl flex-col px-6 py-8 sm:py-12"
      style={{ minHeight: '90vh' }}
    >
      <header className="mb-4">
        <Link
          href="/profile/chat"
          className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          ← Сообщения
        </Link>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <>
          <ul className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-4">
            {messages.length === 0 && pending.length === 0 ? (
              <li className="text-center text-sm italic text-muted-foreground">
                Сообщений пока нет — напишите первым.
              </li>
            ) : null}
            {messages.map((m) => {
              const isMine = m.senderId === user.id;
              return (
                <li key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p
                      className={`mt-1 text-xs ${
                        isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {formatTime(m.createdAt)} ✓
                    </p>
                  </div>
                </li>
              );
            })}
            {pending.map((p) => (
              <li key={p.tempId} className="flex justify-end">
                <div className="max-w-[80%] rounded-lg bg-primary/60 px-3 py-2 text-sm text-primary-foreground">
                  <p className="whitespace-pre-wrap break-words">{p.body}</p>
                  <p className="mt-1 text-xs text-primary-foreground/70">отправляется…</p>
                </div>
              </li>
            ))}
            <div ref={messagesEndRef} />
          </ul>

          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

          <div className="mt-4 flex gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Сообщение…"
              rows={2}
              className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
              disabled={sending}
              maxLength={4000}
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!draft.trim() || sending}
              className="self-end rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {sending ? '…' : 'Отправить'}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
