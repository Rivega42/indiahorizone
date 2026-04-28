import Image from 'next/image';

import { formatPriceLabel } from './_shared';

import type { Tour } from '@/lib/mock/tours';

/**
 * Hero — full-viewport landing-секция тура (#299).
 *
 * - LCP-image через `<Image fill priority>` с AVIF/WebP auto-conversion (#309)
 * - Sticky price box справа на desktop (≥sm)
 * - 2 CTA: «Хочу тур» (anchor #price-block) + «Программа» (anchor #day-timeline)
 * - Trust badges под CTA — массив строк из tour.trustBadges
 */
export function Hero({ tour }: { tour: Tour }): React.ReactElement {
  const priceLabel = formatPriceLabel(tour);

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      {/*
        Hero LCP-image (#309): next/image с priority + fill для responsive cover.
        sizes="100vw" — занимает всю ширину viewport. AVIF/WebP отдаются автоматически
        Next.js'ом через /_next/image route. priority=true → preload-link в head'е,
        не lazy-loaded.
      */}
      <Image
        src={tour.heroPosterUrl}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/80"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-6 pb-16 pt-20 sm:pt-24">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          {tour.season}
        </div>

        <div className="mt-auto space-y-6 text-white">
          <h1 className="font-serif text-5xl font-medium leading-[1.05] tracking-tight sm:text-7xl">
            {tour.title}
          </h1>
          <p className="text-lg text-white/90 sm:text-xl">{tour.region}</p>
          <p className="max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            {tour.emotionalHook}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="#price-block"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Хочу этот тур
              <span aria-hidden>→</span>
            </a>
            <a
              href="#day-timeline"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              Программа по дням
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 text-xs">
            {tour.trustBadges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="absolute right-6 top-20 hidden rounded-2xl border border-white/20 bg-black/40 px-5 py-4 text-right text-white backdrop-blur-md sm:top-24 sm:block">
          <div className="text-xs uppercase tracking-widest text-white/70">Стоимость</div>
          <div className="mt-1 font-serif text-2xl font-medium tabular-nums">{priceLabel}</div>
          <div className="text-xs text-white/70">на человека</div>
        </div>
      </div>
    </section>
  );
}
