'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  getItinerary,
  getTrip,
  type Itinerary,
  type TripDetail,
  type TripStatus,
} from '@/lib/api/trips';
import { useCurrentUser } from '@/lib/auth/store';

/**
 * /profile/trips/[id] — детали поездки + программа (#A-09).
 *
 * Tabs (через ?tab= query param для URL persistence):
 * - program — DayTimeline из последней published-itinerary
 * - documents — placeholder, реализуется отдельно (B-05 + #68)
 * - chat — ссылка на /profile/chat (для конкретного thread'а — позже)
 * - feedback — ссылка на /profile/trips/{id}/feedback (A-11)
 *
 * Баннер «Поездка отменена» при status=cancelled.
 */

type Tab = 'program' | 'documents' | 'chat' | 'feedback';

const TABS: { id: Tab; label: string }[] = [
  { id: 'program', label: 'Программа' },
  { id: 'documents', label: 'Документы' },
  { id: 'chat', label: 'Чат' },
  { id: 'feedback', label: 'Фидбэк' },
];

const STATUS_LABEL: Record<TripStatus, string> = {
  tentative: 'Черновик',
  confirmed: 'Подтверждена',
  in_progress: 'В пути',
  completed: 'Завершена',
  cancelled: 'Отменена',
};

const STATUS_TONE: Record<TripStatus, string> = {
  tentative: 'bg-muted text-muted-foreground',
  confirmed: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100',
  in_progress: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100',
};

function formatDateRange(startsAt: string, endsAt: string): string {
  const fmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${fmt.format(new Date(startsAt))} — ${fmt.format(new Date(endsAt))}`;
}

function ProgramTab({ itinerary }: { itinerary: Itinerary | null }): React.ReactElement {
  if (!itinerary) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Программа в подготовке менеджером.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {itinerary.days.map((day) => (
        <details
          key={day.dayNumber}
          className="group overflow-hidden rounded-lg border border-border bg-card transition hover:border-primary/40"
        >
          <summary className="flex cursor-pointer list-none items-center gap-4 p-5 [&::-webkit-details-marker]:hidden">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-serif text-xl font-medium text-primary">
              {day.dayNumber}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                День {day.dayNumber}
                {day.location ? ` · ${day.location}` : ''}
              </p>
              <h3 className="mt-1 truncate font-medium">{day.title}</h3>
            </div>
            <span className="shrink-0 text-muted-foreground transition group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="space-y-3 px-5 pb-5">
            {day.description ? (
              <p className="text-sm text-muted-foreground">{day.description}</p>
            ) : null}
            {day.activities.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {day.activities.map((a) => (
                  <li
                    key={a}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}

function DocumentsTab(): React.ReactElement {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <p className="text-sm text-muted-foreground">
        Документы (паспорт, виза, билеты, страховка) появятся здесь после загрузки.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">Раздел в разработке (issue #422).</p>
    </div>
  );
}

function ChatTab(): React.ReactElement {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-sm">
        Чат с concierge и гидом — в разделе{' '}
        <Link href="/profile/chat" className="font-medium text-primary hover:underline">
          Сообщения
        </Link>
        .
      </p>
    </div>
  );
}

function FeedbackTab({ tripId }: { tripId: string }): React.ReactElement {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">
        Ежедневный фидбэк по дням поездки — в работе (issue #415).
      </p>
      <p className="mt-2 text-xs text-muted-foreground">Trip ID: {tripId}</p>
    </div>
  );
}

export default function TripDetailPage(): React.ReactElement {
  const user = useCurrentUser();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const tripId = params?.id;

  const initialTab = (search?.get('tab') as Tab | null) ?? 'program';
  const [tab, setTab] = useState<Tab>(
    TABS.some((t) => t.id === initialTab) ? initialTab : 'program',
  );

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function setTabAndUrl(next: Tab): void {
    setTab(next);
    const sp = new URLSearchParams(search?.toString() ?? '');
    sp.set('tab', next);
    router.replace(`?${sp.toString()}`, { scroll: false });
  }

  useEffect(() => {
    if (!user || !tripId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([getTrip(tripId), getItinerary(tripId)])
      .then(([tripData, itin]) => {
        if (cancelled) return;
        setTrip(tripData);
        setItinerary(itin);
      })
      .catch(() => {
        if (!cancelled) setError('Поездка не найдена или нет доступа.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, tripId]);

  if (user === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-medium">Поездка</h1>
        <p className="mt-4 text-muted-foreground">
          Войдите чтобы открыть поездку.{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Войти →
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12 sm:py-16">
      <header>
        <Link
          href="/profile/trips"
          className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          ← Мои поездки
        </Link>
        {loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Загрузка…</p>
        ) : error ? (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        ) : trip ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
                {trip.region}
              </h1>
              <span
                className={`rounded-full px-2 py-0.5 text-xs uppercase tracking-wide ${STATUS_TONE[trip.status]}`}
              >
                {STATUS_LABEL[trip.status]}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatDateRange(trip.startsAt, trip.endsAt)}
            </p>
          </>
        ) : null}
      </header>

      {trip?.status === 'cancelled' ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          Поездка отменена. Если у вас остались вопросы — напишите менеджеру в чат.
        </div>
      ) : null}

      {trip ? (
        <>
          <nav className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTabAndUrl(t.id)}
                aria-selected={tab === t.id}
                className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  tab === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <section>
            {tab === 'program' ? <ProgramTab itinerary={itinerary} /> : null}
            {tab === 'documents' ? <DocumentsTab /> : null}
            {tab === 'chat' ? <ChatTab /> : null}
            {tab === 'feedback' && tripId ? <FeedbackTab tripId={tripId} /> : null}
          </section>
        </>
      ) : null}
    </main>
  );
}
