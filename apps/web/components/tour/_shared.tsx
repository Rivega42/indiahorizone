/**
 * Shared utilities для tour landing components (#310).
 *
 * `formatRub` — форматирование цен по RU-локали (250 000 вместо 250000).
 * `formatPriceLabel` — диапазон "X — Y ₽" или "от X ₽" в зависимости от наличия priceTo.
 * `SectionHead` — eyebrow + h2 + subtitle блок, общий для всех секций.
 */
import type { Tour } from '@/lib/mock/tours';

export function formatRub(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

export function formatPriceLabel(tour: Pick<Tour, 'priceFromRub' | 'priceToRub'>): string {
  if (tour.priceToRub) {
    return `${formatRub(tour.priceFromRub)} — ${formatRub(tour.priceToRub)} ₽`;
  }
  return `от ${formatRub(tour.priceFromRub)} ₽`;
}

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export function SectionHead({
  eyebrow,
  title,
  subtitle,
  align = 'left',
}: SectionHeadProps): React.ReactElement {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      <div className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </div>
      <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
        {title}
      </h2>
      {subtitle ? (
        <p
          className={`mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg ${
            align === 'center' ? 'mx-auto' : ''
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
