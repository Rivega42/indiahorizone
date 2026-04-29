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

export function formatPriceLabel(
  tour: Pick<Tour, 'priceFromRub'> & { priceToRub?: number | null },
): string {
  if (tour.priceToRub) {
    return `${formatRub(tour.priceFromRub)} — ${formatRub(tour.priceToRub)} ₽`;
  }
  return `от ${formatRub(tour.priceFromRub)} ₽`;
}

/**
 * Корректное склонение существительного «день»:
 * 1 день, 2-4 дня, 5-20 дней, 21 день, 22 дня, ...
 */
export function pluralizeDays(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return `${n} дней`;
  const last = n % 10;
  if (last === 1) return `${n} день`;
  if (last >= 2 && last <= 4) return `${n} дня`;
  return `${n} дней`;
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
