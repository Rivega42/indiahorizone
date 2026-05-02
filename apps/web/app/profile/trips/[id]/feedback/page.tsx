'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  createFeedback,
  listTripFeedbacks,
  MOOD_EMOJI,
  MOOD_LABEL,
  MOOD_ORDER,
  type Feedback,
  type FeedbackMood,
} from '@/lib/api/feedback';
import { useCurrentUser } from '@/lib/auth/store';

/**
 * /profile/trips/[id]/feedback — ежедневный фидбэк (#A-11).
 *
 * Query: ?day=N (из push-уведомления или вручную). Default 1.
 *
 * Form:
 * - 5 emoji-mood (bad/neutral/ok/good/excellent)
 * - textarea ≤500 chars
 * - Submit с Idempotency-Key (через createFeedback)
 *
 * После submit показываем список всех feedback'ов поездки со статусами.
 */

const MAX_BODY = 500;

type FeedbackByDay = Record<number, Feedback>;

function indexByDay(items: Feedback[]): FeedbackByDay {
  const map: FeedbackByDay = {};
  for (const f of items) {
    // Если несколько за один день (text + circle), оставляем последний
    if (!map[f.dayNumber] || new Date(f.createdAt) > new Date(map[f.dayNumber]!.createdAt)) {
      map[f.dayNumber] = f;
    }
  }
  return map;
}

export default function FeedbackPage(): React.ReactElement {
  const user = useCurrentUser();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const tripId = params?.id;
  const dayParam = Number(search?.get('day') ?? '1');
  const [day, setDay] = useState<number>(Number.isFinite(dayParam) && dayParam > 0 ? dayParam : 1);

  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mood, setMood] = useState<FeedbackMood | null>(null);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !tripId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    listTripFeedbacks(tripId)
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить фидбэки.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, tripId]);

  function changeDay(next: number): void {
    setDay(next);
    setMood(null);
    setBody('');
    const sp = new URLSearchParams(search?.toString() ?? '');
    sp.set('day', String(next));
    router.replace(`?${sp.toString()}`, { scroll: false });
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!tripId || !mood || !body.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    setToast(null);
    try {
      const created = await createFeedback({
        tripId,
        dayNumber: day,
        type: 'text',
        body: body.trim(),
        mood,
      });
      setItems((prev) => [...prev.filter((f) => f.dayNumber !== day), created]);
      setToast('Спасибо! Concierge увидит ваш фидбэк.');
      setMood(null);
      setBody('');
      setTimeout(() => setToast(null), 3500);
    } catch {
      setError('Не удалось отправить. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  }

  const byDay = indexByDay(items);
  const submitted = byDay[day];

  if (user === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-medium">Фидбэк</h1>
        <p className="mt-4 text-muted-foreground">
          Войдите чтобы оставить фидбэк.{' '}
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
          href={tripId ? `/profile/trips/${tripId}` : '/profile/trips'}
          className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          ← Поездка
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          Как прошёл день {day}?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Concierge читает каждое сообщение и отвечает в чате при необходимости.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <>
          {submitted ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{MOOD_EMOJI[submitted.mood]}</span>
                <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  Фидбэк за день {day} отправлен
                </span>
              </div>
              <p className="mt-2 text-sm text-emerald-900/80 dark:text-emerald-100/80">
                {submitted.body}
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
              <div>
                <span className="text-sm font-medium">Оценка</span>
                <div className="mt-2 flex gap-2">
                  {MOOD_ORDER.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-label={MOOD_LABEL[m]}
                      onClick={() => setMood(m)}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-lg border-2 px-2 py-3 transition ${
                        mood === m
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <span className="text-2xl">{MOOD_EMOJI[m]}</span>
                      <span className="text-xs text-muted-foreground">{MOOD_LABEL[m]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-medium">Что было хорошо или плохо?</span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={MAX_BODY}
                  rows={6}
                  placeholder="Опишите как прошёл день…"
                  className="mt-1 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  {body.length}/{MAX_BODY}
                </span>
              </label>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <button
                type="submit"
                disabled={!mood || !body.trim() || submitting}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? 'Отправка…' : 'Отправить'}
              </button>
            </form>
          )}

          {toast ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{toast}</p> : null}

          <section className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              История по дням
            </h2>
            {Object.keys(byDay).length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет ни одного фидбэка.</p>
            ) : (
              <ul className="space-y-2">
                {Array.from(
                  { length: Math.max(...Object.keys(byDay).map(Number), day) },
                  (_, i) => i + 1,
                ).map((n) => {
                  const f = byDay[n];
                  const isCurrent = n === day;
                  return (
                    <li key={n}>
                      <button
                        type="button"
                        onClick={() => changeDay(n)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-left transition ${
                          isCurrent
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:border-primary/40'
                        }`}
                      >
                        <span className="text-sm font-medium">День {n}</span>
                        <span className="text-sm text-muted-foreground">
                          {f ? `${MOOD_EMOJI[f.mood]} отправлено` : '☐ записать'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
