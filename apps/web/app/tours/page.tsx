import Image from 'next/image';
import Link from 'next/link';

import type { Metadata } from 'next';

import { formatPriceLabel, pluralizeDays } from '@/components/tour/_shared';
import { listTourSummaries, type TourSummary } from '@/lib/api/tours';

/**
 * /tours — каталог всех опубликованных туров (#293 EPIC 12).
 *
 * Server component с ISR (revalidate 1h синхронно с landing-страницей).
 * Mobile-first 1 col → ≥sm 2 col → ≥lg 3 col.
 *
 * SEO: index/follow + canonical. Card-карточки используют next/image lazy
 * для всех (без priority — это secondary listing, не LCP).
 */

export const revalidate = 3600;

const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://indiahorizone.ru';

export const metadata: Metadata = {
  title: 'Все туры в Индию',
  description:
    'Каталог всех туров IndiaHorizone — Керала, Гоа, Гималаи, Раджастан и другие. Tech-enabled India concierge для русскоязычных путешественников.',
  alternates: { canonical: `${SITE_URL}/tours` },
  openGraph: {
    title: 'Все туры в Индию · IndiaHorizone',
    description: 'Каталог всех туров IndiaHorizone — Керала, Гоа, Гималаи, Раджастан и другие.',
    url: `${SITE_URL}/tours`,
    siteName: 'IndiaHorizone',
    locale: 'ru_RU',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default async function ToursIndexPage(): Promise<React.ReactElement> {
  const tours = await listTourSummaries();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border bg-muted/40 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Каталог туров
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
            Туры в Индию
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Каждое путешествие мы собираем под клиента. Здесь — текущие маршруты с фиксированными
            датами. Программа, цена и состав услуг утверждаются после короткого разговора.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        {tours.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-12 text-center text-muted-foreground">
            Пока нет опубликованных туров. Скоро добавим.
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <li key={tour.slug}>
                <TourCard tour={tour} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <UpcomingTeaser />
    </main>
  );
}

// ─────────────────────────────────────── Upcoming teaser
//
// Маршруты в работе — статичный список, не из БД. Когда тур готов
// (контент + фото) — переезжает в seed/tours/<slug>.json со status: PUBLISHED
// и удаляется из этого массива. До тех пор — placeholder card с "Скоро"
// чтобы посетитель видел, что у нас не один тур, а развитие.
//
// Recommendation: не превращать teaser в "пустую витрину" — больше 3-4
// upcoming = читается как "обещаем но не делаем". Лучше 2-3 близких к запуску.

interface UpcomingTour {
  region: string;
  season: string;
  /** Короткий emotional hook (1 предложение) */
  hint: string;
}

const UPCOMING_TOURS: UpcomingTour[] = [
  {
    region: 'Гоа · форты и пляжи',
    season: 'Январь 2027',
    hint: 'Океан, форты португальских колоний и закатные пляжи Палолема.',
  },
  {
    region: 'Раджастан · дворцы и пустыня',
    season: 'Февраль 2027',
    hint: 'Джайпур, Удайпур, Джодхпур — города-крепости и сафари в Тар.',
  },
  {
    region: 'Гималаи · Маналли',
    season: 'Май 2027',
    hint: 'Треккинг по альпийским долинам, монастыри, чистый горный воздух.',
  },
];

function UpcomingTeaser(): React.ReactElement {
  return (
    <section className="border-t border-border bg-muted/40 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Скоро</p>
        <h2 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          Маршруты, которые мы готовим
        </h2>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Можно записаться в early-bird лист — сообщим за 2 месяца до запуска и предложим скидку.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {UPCOMING_TOURS.map((u) => (
            <li
              key={u.region}
              className="rounded-2xl border border-dashed border-border bg-background p-5"
            >
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60" />
                {u.season}
              </div>
              <h3 className="mt-2 font-serif text-lg font-medium leading-snug">{u.region}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{u.hint}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="https://t.me/indiahorizone"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/20"
          >
            Записаться в early-bird → Telegram
          </a>
          <span className="text-xs text-muted-foreground">
            Без обязательств. Не более 1 сообщения / тур.
          </span>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────── TourCard

function TourCard({ tour }: { tour: TourSummary }): React.ReactElement {
  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={tour.heroPosterUrl}
          alt={tour.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          className="object-cover transition group-hover:scale-105"
        />
        <div className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-md">
          {tour.season}
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <h2 className="font-serif text-xl font-medium leading-tight sm:text-2xl">{tour.title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{tour.region}</p>
        <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Стоимость</div>
            <div className="mt-0.5 font-serif text-lg font-medium tabular-nums">
              {formatPriceLabel(tour)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Программа</div>
            <div className="mt-0.5 font-medium">{pluralizeDays(tour.durationDays)}</div>
          </div>
        </div>
        <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition group-hover:gap-2.5">
          Подробнее <span aria-hidden>→</span>
        </div>
      </div>
    </Link>
  );
}
