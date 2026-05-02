'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { getItinerary, getTrip, type Itinerary, type TripDetail } from '@/lib/api/trips';
import { useCurrentUser } from '@/lib/auth/store';

/**
 * /profile/trips/[id]/dashboard — главный экран активной поездки (#A-13).
 *
 * Hero: «День N из M» + локация + дата.
 * Карточки СЕЙЧАС / СЛЕДУЮЩЕЕ — текущий и следующий день программы
 * (детальное расписание активностей по часам — phase 4 backend extension).
 * 4 quick actions: Программа / Фидбэк / Чат / Контакт гида.
 *
 * Refresh каждые 60s. Pause на background tab через document.visibilityState.
 *
 * Push-напоминания (event-reminder-2h/30m) — отдельный backend issue,
 * не блокирует UI. На каждом дне можно показывать заметку «push придёт за 2ч».
 */

const POLL_MS = 60_000;

interface CurrentNext {
  dayNumber: number;
  totalDays: number;
  current: { title: string; description: string | null; location: string | null } | null;
  next: {
    title: string;
    description: string | null;
    location: string | null;
    offsetDays: number;
  } | null;
}

function computeCurrentNext(trip: TripDetail, itinerary: Itinerary | null, now: Date): CurrentNext {
  const startMs = new Date(trip.startsAt).getTime();
  const endMs = new Date(trip.endsAt).getTime();
  const totalDays = Math.max(1, Math.ceil((endMs - startMs) / (24 * 60 * 60 * 1000)) + 1);
  const elapsedMs = now.getTime() - startMs;
  // Day 1 = первый день поездки
  const dayNumber = Math.min(
    Math.max(1, Math.floor(elapsedMs / (24 * 60 * 60 * 1000)) + 1),
    totalDays,
  );

  const days = itinerary?.days ?? [];
  const current = days.find((d) => d.dayNumber === dayNumber) ?? null;
  const nextDay = days.find((d) => d.dayNumber === dayNumber + 1) ?? null;

  return {
    dayNumber,
    totalDays,
    current: current
      ? { title: current.title, description: current.description, location: current.location }
      : null,
    next: nextDay
      ? {
          title: nextDay.title,
          description: nextDay.description,
          location: nextDay.location,
          offsetDays: 1,
        }
      : null,
  };
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));
}

export default function TripDashboardPage(): React.ReactElement {
  const user = useCurrentUser();
  const params = useParams<{ id: string }>();
  const tripId = params?.id;

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load + polling + visibility-aware
  useEffect(() => {
    if (!user || !tripId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function load(silent = false): Promise<void> {
      try {
        const [tripData, itin] = await Promise.all([getTrip(tripId), getItinerary(tripId)]);
        if (cancelled) return;
        setTrip(tripData);
        setItinerary(itin);
        setNow(new Date());
      } catch {
        if (!silent && !cancelled) setError('Не удалось загрузить поездку.');
      } finally {
        if (!silent && !cancelled) setLoading(false);
      }
    }

    void load(false);

    function start(): void {
      if (timer) return;
      timer = setInterval(() => void load(true), POLL_MS);
    }
    function stop(): void {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    function onVis(): void {
      if (document.visibilityState === 'visible') {
        void load(true);
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
      cancelled = true;
      stop();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }, [user, tripId]);

  const cn = useMemo(() => {
    if (!trip) return null;
    return computeCurrentNext(trip, itinerary, now);
  }, [trip, itinerary, now]);

  if (user === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-medium">Поездка</h1>
        <p className="mt-4 text-muted-foreground">
          Войдите чтобы открыть дашборд.{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Войти →
          </Link>
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      </main>
    );
  }

  if (error || !trip || !cn) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/profile/trips"
          className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          ← Мои поездки
        </Link>
        <p className="mt-4 text-sm text-destructive">{error ?? 'Поездка не найдена.'}</p>
      </main>
    );
  }

  const isActive = trip.status === 'in_progress';

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-8 sm:py-12">
      <header>
        <Link
          href={`/profile/trips/${tripId}`}
          className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          ← Поездка
        </Link>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-primary">
          День {cn.dayNumber} из {cn.totalDays}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          {trip.region}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(trip.startsAt)} — {formatDate(trip.endsAt)}
        </p>
      </header>

      {!isActive ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Поездка ещё не активна (статус: {trip.status}). Дашборд показывает план, фактический
          отсчёт начнётся после старта.
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Сейчас</p>
          {cn.current ? (
            <>
              <h2 className="mt-2 text-xl font-medium">{cn.current.title}</h2>
              {cn.current.location ? (
                <p className="mt-1 text-sm text-muted-foreground">{cn.current.location}</p>
              ) : null}
              {cn.current.description ? (
                <p className="mt-3 text-sm">{cn.current.description}</p>
              ) : null}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Программа на день ещё не загружена менеджером.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Следующее
          </p>
          {cn.next ? (
            <>
              <h2 className="mt-2 text-xl font-medium">{cn.next.title}</h2>
              {cn.next.location ? (
                <p className="mt-1 text-sm text-muted-foreground">{cn.next.location}</p>
              ) : null}
              <p className="mt-3 text-xs text-muted-foreground">Через {cn.next.offsetDays} день</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {cn.dayNumber >= cn.totalDays
                ? 'Это последний день поездки.'
                : 'Программа на следующий день в подготовке.'}
            </p>
          )}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Быстрые действия
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/profile/trips/${tripId}?tab=program`}
            className="rounded-lg border border-border bg-card p-4 text-center transition hover:border-primary/40"
          >
            <span className="block text-2xl">🗺️</span>
            <span className="mt-1 block text-sm font-medium">Программа</span>
          </Link>
          <Link
            href={`/profile/trips/${tripId}/feedback?day=${cn.dayNumber}`}
            className="rounded-lg border border-border bg-card p-4 text-center transition hover:border-primary/40"
          >
            <span className="block text-2xl">📝</span>
            <span className="mt-1 block text-sm font-medium">Фидбэк</span>
          </Link>
          <Link
            href="/profile/chat"
            className="rounded-lg border border-border bg-card p-4 text-center transition hover:border-primary/40"
          >
            <span className="block text-2xl">💬</span>
            <span className="mt-1 block text-sm font-medium">Чат</span>
          </Link>
          <Link
            href={`/profile/trips/${tripId}?tab=documents`}
            className="rounded-lg border border-border bg-card p-4 text-center transition hover:border-primary/40"
          >
            <span className="block text-2xl">📂</span>
            <span className="mt-1 block text-sm font-medium">Документы</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
