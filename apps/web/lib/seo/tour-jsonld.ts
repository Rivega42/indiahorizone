/**
 * Schema.org JSON-LD генераторы для tour landing (#308).
 *
 * Зачем:
 * - Яндекс читает Schema.org для rich snippets (звёздочки, цена, FAQ-аккордеон)
 * - Google Travel понимает TouristTrip / TouristAttraction для travel search
 * - FAQPage даёт expandable вопросы прямо в выдаче
 *
 * Почему не через `<script type="application/ld+json">` в metadata API:
 * Next.js Metadata API не поддерживает JSON-LD. Эти строки рендерятся inline
 * в page.tsx через `<script type="application/ld+json" dangerouslySetInnerHTML />`.
 *
 * Спецификация:
 * - https://schema.org/TouristTrip — для тура целиком
 * - https://schema.org/TouristAttraction — для каждого дня (внутри itinerary)
 * - https://schema.org/FAQPage — для блока вопросов
 *
 * Принципы:
 * - Все поля — JSON-safe (никаких function/Date/undefined)
 * - Цены — number, не string ('250000', не '250 000 ₽')
 * - URL — абсолютные (https://indiahorizone.ru/...) — Яндекс игнорирует относительные
 */

import type { Tour } from '../mock/tours';

const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://indiahorizone.ru';

interface JsonLdOffer {
  '@type': 'Offer';
  price: number;
  priceCurrency: string;
  availability: string;
  url: string;
  priceValidUntil?: string;
}

interface JsonLdAttraction {
  '@type': 'TouristAttraction';
  name: string;
  description: string;
  image: string;
}

interface JsonLdTouristTrip {
  '@context': 'https://schema.org';
  '@type': 'TouristTrip';
  name: string;
  description: string;
  image: string[];
  url: string;
  touristType: string[];
  offers: JsonLdOffer;
  itinerary: JsonLdAttraction[];
  provider: {
    '@type': 'Organization';
    name: string;
    url: string;
  };
}

interface JsonLdFAQ {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: {
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }[];
}

function absoluteUrl(maybeRelative: string): string {
  if (maybeRelative.startsWith('http://') || maybeRelative.startsWith('https://')) {
    return maybeRelative;
  }
  if (maybeRelative.startsWith('/')) {
    return `${SITE_URL}${maybeRelative}`;
  }
  return `${SITE_URL}/${maybeRelative}`;
}

/**
 * TouristTrip JSON-LD для тура целиком.
 *
 * Цена: используем priceFromRub. Если есть priceToRub — указываем priceFromRub
 * как точку входа (минимум). Schema.org не имеет clean-way для price-range,
 * поэтому Offer.price = priceFromRub. Range уже видно в hero-блоке landing'а.
 *
 * touristType: подсказывает Google Travel какой тип путешественника.
 * "Cultural traveler" + "Adventure traveler" — типичный mix Кералы.
 */
export function buildTouristTripJsonLd(tour: Tour): JsonLdTouristTrip {
  const tourUrl = `${SITE_URL}/tours/${tour.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: tour.title,
    description: tour.emotionalHook,
    image: [absoluteUrl(tour.heroPosterUrl)],
    url: tourUrl,
    touristType: ['Cultural traveler', 'Adventure traveler', 'Wellness traveler'],
    offers: {
      '@type': 'Offer',
      price: tour.priceFromRub,
      priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock',
      url: tourUrl,
    },
    itinerary: tour.days.map((day) => ({
      '@type': 'TouristAttraction',
      name: `День ${day.dayNumber}: ${day.title}`,
      description: day.description,
      image: absoluteUrl(day.imageUrl),
    })),
    provider: {
      '@type': 'Organization',
      name: 'IndiaHorizone',
      url: SITE_URL,
    },
  };
}

/**
 * FAQPage JSON-LD — отдельным блоком (Яндекс/Google требует именно так).
 *
 * Ответ может быть в HTML — `<a>`, `<strong>` и т.д. Яндекс рендерит safe-subset.
 * Но source-of-truth у нас plain text → keep simple.
 */
export function buildFaqPageJsonLd(tour: Tour): JsonLdFAQ {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tour.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}
