'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { listMyTrips, type TripStatus, type TripSummary } from '@/lib/api/trips';
import { useCurrentUser } from '@/lib/auth/store';

/**
 * /profile/trips — список всех поездок клиента (#A-08).
 *
 * Группировка: «Активная» (in_progress) / «Предстоящие» (tentative+confirmed)
 * / «Прошедшие» (completed+cancelled).
 *
 * Empty state с CTA «Посмотреть туры» если нет поездок.
 */

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

interface Buckets {
  active: TripSummary[];
  upcoming: TripSummary[];
  past: TripSummary[];
}

function groupTrips(items: TripSummary[]): Buckets {
  const active: TripSummary[] = [];
  const upcoming: TripSummary[] = [];
  const past: TripSummary[] = [];
  for (const t of items) {
    if (t.status === 'in_progress') active.push(t);
    else if (t.status === 'tentative' || t.status === 'confirmed') upcoming.push(t);
    else past.push(t);
  }
  // По датам: active по startsAt, upcoming по startsAt asc, past по endsAt desc.
  active.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  upcoming.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  past.sort((a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime());
  return { active, upcoming, past };
}

function formatDateRange(startsAt: string, endsAt: string): string {
  const fmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt.format(new Date(startsAt))} — ${fmt.format(new Date(endsAt))}`;
}

function formatPrice(amount: string | null, currency: string | null): string | null {
  if (!amount) return null;
  const value = Number(amount);
  if (!Number.isFinite(value)) return null;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency ?? 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

function TripCard({ trip }: { trip: TripSummary }): React.ReactElement {
  const price = formatPrice(trip.totalAmount, trip.currency);
  return (
    <Link
      href={`/profile/trips/${trip.id}`}
      className="block rounded-lg border border-border bg-card p-5 transition hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{trip.region}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs uppercase tracking-wide ${STATUS_TONE[trip.status]}`}
            >
              {STATUS_LABEL[trip.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateRange(trip.startsAt, trip.endsAt)}
          </p>
        </div>
        {price ? <span className="shrink-0 font-medium">{price}</span> : null}
      </div>
    </Link>
  );
}

function Section({
  title,
  trips,
}: {
  title: string;
  trips: TripSummary[];
}): React.ReactElement | null {
  if (trips.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-2">
        {trips.map((t) => (
          <TripCard key={t.id} trip={t} />
        ))}
      </div>
    </section>
  );
}

export default function MyTripsPage(): React.ReactElement {
  const user = useCurrentUser();
  const [items, setItems] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    listMyTrips()
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить поездки. Попробуйте обновить страницу.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const buckets = useMemo(() => groupTrips(items), [items]);

  if (user === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-medium">Мои поездки</h1>
        <p className="mt-4 text-muted-foreground">
          Войдите чтобы увидеть свои поездки.{' '}
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
          Мои поездки
        </h1>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">У вас пока нет поездок.</p>
          <Link
            href="/tours"
            className="mt-4 inline-block font-medium text-primary hover:underline"
          >
            Посмотреть туры →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <Section title="Активная" trips={buckets.active} />
          <Section title="Предстоящие" trips={buckets.upcoming} />
          <Section title="Прошедшие" trips={buckets.past} />
        </div>
      )}
    </main>
  );
}
