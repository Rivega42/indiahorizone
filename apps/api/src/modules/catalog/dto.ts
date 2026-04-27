/**
 * Public DTOs для catalog module.
 *
 * Принципиальное правило: `costInrFrom` / `costInrTo` поля TourDay —
 * **internal** (для аналитики маржи). В DTO **исключаются**, чтобы
 * не утечь в публичный bundle (Next.js getStaticProps бросит весь
 * объект в HTML, поэтому фильтруем на сервере, до response).
 *
 * Issue: #296 [12.3]
 */

export interface TourDayDto {
  dayNumber: number;
  location: string;
  title: string;
  description: string;
  /** {kind, label}[] — типизированные активности */
  activities: unknown;
  imageUrl: string;
  isOptional: boolean;
  // costInrFrom, costInrTo — НЕ включены в публичный DTO
}

export interface TourSummaryDto {
  slug: string;
  title: string;
  region: string;
  durationDays: number;
  season: string;
  priceFromRub: number;
  priceToRub: number | null;
  heroPosterUrl: string;
}

export interface TourDetailsDto extends TourSummaryDto {
  groupSize: string;
  heroVideoUrl: string | null;
  emotionalHook: string;
  /** string[] */
  trustBadges: unknown;
  /** {iconKind, label, value}[] */
  facts: unknown;
  /** {included: string[], notIncluded: string[]} */
  inclusions: unknown;
  /** {q, a}[] */
  faq: unknown;
  days: TourDayDto[];
}
