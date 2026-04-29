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
    </main>
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
