import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';

import type { Metadata } from 'next';

import { DayTimeline } from '@/components/tour/DayTimeline';
import { Facts } from '@/components/tour/Facts';
import { FAQ } from '@/components/tour/FAQ';
import { FooterLegal } from '@/components/tour/FooterLegal';
import { Hero } from '@/components/tour/Hero';
import { Inclusions } from '@/components/tour/Inclusions';
import { PriceBlock } from '@/components/tour/PriceBlock';
import { Reviews } from '@/components/tour/Reviews';
import { getTourBySlug, listTourSlugs } from '@/lib/api/tours';
import { buildFaqPageJsonLd, buildTouristTripJsonLd } from '@/lib/seo/tour-jsonld';

// LeadForm — below-the-fold (#price-block). Динамический импорт убирает
// axios + react-hook-form клиент-бандл из initial JS, ускоряя LCP/INP.
// SSR=true сохраняет HTML pre-render → нет layout shift при гидратации.
const LeadForm = dynamic(() => import('./lead-form').then((mod) => ({ default: mod.LeadForm })));

export const revalidate = 3600;

const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://indiahorizone.ru';

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await listTourSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * SEO + Open Graph + Twitter Card (#308).
 *
 * Title: «<тур> — <регион>». Russian-first для Яндекса.
 * Description: emotional_hook (3-4 строки) — у Яндекса лимит ~250 символов
 * на snippet, обрежется автоматически.
 * Canonical: абсолютный URL — Яндекс игнорирует относительные.
 *
 * Open Graph: type='website' (не 'article') — Telegram preview корректнее
 * рендерится для website, чем для article (для last нужны author/date).
 *
 * robots: index/follow — туры PUBLIC по определению. NOINDEX-логика для
 * DRAFT/SOLD-OUT — отдельный issue.
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tour = await getTourBySlug(params.slug);
  if (!tour) {
    return {
      title: 'Тур не найден',
      robots: { index: false, follow: false },
    };
  }

  const tourUrl = `${SITE_URL}/tours/${tour.slug}`;
  const fullTitle = `${tour.title} — ${tour.region}`;
  const heroImage = tour.heroPosterUrl.startsWith('http')
    ? tour.heroPosterUrl
    : `${SITE_URL}${tour.heroPosterUrl}`;

  return {
    title: fullTitle,
    description: tour.emotionalHook,
    alternates: { canonical: tourUrl },
    openGraph: {
      title: fullTitle,
      description: tour.emotionalHook,
      url: tourUrl,
      siteName: 'IndiaHorizone',
      locale: 'ru_RU',
      type: 'website',
      images: [{ url: heroImage, width: 1920, height: 1080, alt: tour.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: tour.emotionalHook,
      images: [heroImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    other: {
      // Яндекс.Вебмастер verification — задаётся через env при деплое.
      // Без значения тег не рендерится (Next.js skip'ает falsy other-keys).
      ...(process.env['NEXT_PUBLIC_YANDEX_VERIFICATION']
        ? { 'yandex-verification': process.env['NEXT_PUBLIC_YANDEX_VERIFICATION'] }
        : {}),
    },
  };
}

export default async function TourPage({
  params,
}: {
  params: { slug: string };
}): Promise<React.ReactElement> {
  const tour = await getTourBySlug(params.slug);
  if (!tour) notFound();

  const tripJsonLd = buildTouristTripJsonLd(tour);
  const faqJsonLd = buildFaqPageJsonLd(tour);

  return (
    <main className="min-h-svh bg-background text-foreground">
      {/*
        JSON-LD рендерим как inline `<script>` — Next.js Metadata API не поддерживает.
        dangerouslySetInnerHTML безопасен здесь: входные данные — typed Tour из нашего же
        API/mock'а (никакого user-input не попадает в JSON.stringify).
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tripJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Hero tour={tour} />
      <Facts tour={tour} />
      <DayTimeline tour={tour} />
      <Inclusions tour={tour} />
      {tour.reviews.length > 0 ? <Reviews tour={tour} /> : null}
      <PriceBlock tour={tour} leadFormSlot={<LeadForm tourSlug={tour.slug} />} />
      <FAQ tour={tour} />
      <FooterLegal />
    </main>
  );
}
