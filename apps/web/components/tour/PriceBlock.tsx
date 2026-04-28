import { formatPriceLabel } from './_shared';

import type { Tour } from '@/lib/mock/tours';

/**
 * PriceBlock + LeadForm slot (#304).
 *
 * `leadFormSlot` — ReactNode (обычно dynamic-imported `<LeadForm tourSlug={tour.slug}>`).
 * Принимаем как prop, чтобы dynamic import оставался на уровне страницы и не
 * затрагивал bundle этого компонента (RSC-friendly).
 *
 * 2-column layout на ≥lg, single на mobile. Anchor #price-block — для CTA из Hero.
 */
export function PriceBlock({
  tour,
  leadFormSlot,
}: {
  tour: Tour;
  leadFormSlot: React.ReactNode;
}): React.ReactElement {
  const priceLabel = formatPriceLabel(tour);

  return (
    <section id="price-block" className="bg-foreground py-20 text-background sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <div className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Бронирование
            </div>
            <h2 className="font-serif text-4xl font-medium leading-tight sm:text-5xl">
              Этот тур — про вас
            </h2>
            <p className="mt-5 max-w-md text-base text-background/80 sm:text-lg">
              Каждое путешествие мы собираем под клиента. Точная стоимость — после короткого
              разговора. Без обязательств.
            </p>
            <div className="mt-10 space-y-1">
              <div className="text-sm text-background/60">Стоимость от</div>
              <div className="font-serif text-5xl font-medium tabular-nums sm:text-6xl">
                {priceLabel}
              </div>
              <div className="text-sm text-background/60">на человека</div>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="https://t.me/indiahorizone"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-background/20 bg-background/10 px-6 py-3 text-sm font-semibold text-background backdrop-blur-md transition hover:bg-background/20"
              >
                Написать в Telegram →
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-background/20 bg-background/5 p-6 backdrop-blur-md sm:p-8">
            {leadFormSlot}
          </div>
        </div>
      </div>
    </section>
  );
}
