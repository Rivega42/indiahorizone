import {
  Bed,
  Calendar,
  Car,
  Check,
  ChevronDown,
  Clock,
  Headset,
  Leaf,
  Mountain,
  Music,
  Sparkles,
  UtensilsCrossed,
  Users,
  Waves,
  X,
} from 'lucide-react';
import { notFound } from 'next/navigation';

import { LeadForm } from './lead-form';

import type { ActivityKind, Tour } from '@/lib/mock/tours';
import type { Metadata } from 'next';

import { getTourBySlug, listTourSlugs } from '@/lib/api/tours';
import { buildFaqPageJsonLd, buildTouristTripJsonLd } from '@/lib/seo/tour-jsonld';

export const revalidate = 3600;

const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://indiahorizone.ru';

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await listTourSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * SEO + Open Graph + Twitter Card (#308).
 *
 * Title: «<тур> — <регион> · IndiaHorizone». Russian-first для Яндекса.
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
      {tour.reviews.length > 0 && <Reviews tour={tour} />}
      <PriceBlock tour={tour} />
      <FAQ tour={tour} />
      <FooterLegal />
    </main>
  );
}

// ─────────────────────────────────────── Hero

function Hero({ tour }: { tour: Tour }): React.ReactElement {
  const priceLabel = tour.priceToRub
    ? `${formatRub(tour.priceFromRub)} — ${formatRub(tour.priceToRub)} ₽`
    : `от ${formatRub(tour.priceFromRub)} ₽`;

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${tour.heroPosterUrl})` }}
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

// ─────────────────────────────────────── Quick Facts

function Facts({ tour }: { tour: Tour }): React.ReactElement {
  const iconMap: Record<string, React.ReactElement> = {
    clock: <Clock className="h-5 w-5" aria-hidden />,
    users: <Users className="h-5 w-5" aria-hidden />,
    calendar: <Calendar className="h-5 w-5" aria-hidden />,
    bed: <Bed className="h-5 w-5" aria-hidden />,
    car: <Car className="h-5 w-5" aria-hidden />,
    headset: <Headset className="h-5 w-5" aria-hidden />,
  };

  return (
    <section className="border-y border-border bg-muted/40 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {tour.facts.map((fact) => (
            <div key={fact.label} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                {iconMap[fact.iconKind]}
              </span>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {fact.label}
                </div>
                <div className="mt-0.5 font-medium">{fact.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────── Day Timeline

const ACTIVITY_ICONS: Record<ActivityKind, React.ReactElement> = {
  culture: <Music className="h-3.5 w-3.5" aria-hidden />,
  nature: <Leaf className="h-3.5 w-3.5" aria-hidden />,
  food: <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden />,
  water: <Waves className="h-3.5 w-3.5" aria-hidden />,
  adventure: <Mountain className="h-3.5 w-3.5" aria-hidden />,
  wellness: <Sparkles className="h-3.5 w-3.5" aria-hidden />,
};

function DayTimeline({ tour }: { tour: Tour }): React.ReactElement {
  return (
    <section id="day-timeline" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead
          eyebrow="Программа"
          title="10 дней — без хаоса, день за днём"
          subtitle="Каждый день продуман: что смотрим, где живём, чем занимаемся. Опциональные активности можно поменять за день."
        />
        <div className="mt-14 space-y-3">
          {tour.days.map((day) => (
            <details
              key={day.dayNumber}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40"
            >
              <summary className="flex cursor-pointer list-none items-center gap-5 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-serif text-2xl font-medium text-primary">
                  {day.dayNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    День {day.dayNumber} · {day.location}
                    {day.isOptional && (
                      <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                        на выбор
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 font-serif text-xl font-medium leading-tight sm:text-2xl">
                    {day.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {day.activities.map((act, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs"
                      >
                        {ACTIVITY_ICONS[act.kind]}
                        {act.label}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronDown
                  className="h-5 w-5 text-muted-foreground transition group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="grid gap-6 px-5 pb-6 sm:grid-cols-2 sm:px-6">
                <div
                  className="aspect-[16/9] rounded-xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${day.imageUrl})` }}
                  aria-label={`Фото: ${day.location}`}
                  role="img"
                />
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {day.description}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────── Inclusions

function Inclusions({ tour }: { tour: Tour }): React.ReactElement {
  return (
    <section className="border-y border-border bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead
          eyebrow="Что входит"
          title="Прозрачно: что включено, что — нет"
          subtitle="Не включённое — не «забыли», а сознательное решение. Помогаем по каждому пункту."
        />
        <div className="mt-12 grid gap-10 sm:grid-cols-2">
          <div>
            <h3 className="mb-5 flex items-center gap-2 font-serif text-xl font-medium">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-4 w-4" aria-hidden />
              </span>
              Включено
            </h3>
            <ul className="space-y-3 text-sm sm:text-base">
              {tour.inclusions.included.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-5 flex items-center gap-2 font-serif text-xl font-medium">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted-foreground/10 text-muted-foreground">
                <X className="h-4 w-4" aria-hidden />
              </span>
              Не включено
            </h3>
            <ul className="space-y-3 text-sm sm:text-base">
              {tour.inclusions.notIncluded.map((item) => (
                <li key={item} className="flex gap-3">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────── Reviews (placeholder)

function Reviews({ tour }: { tour: Tour }): React.ReactElement {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead
          eyebrow="Отзывы"
          title="Что говорят клиенты"
          subtitle="Только реальные отзывы с consent. Появятся после первых поездок."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tour.reviews.map((r) => (
            <article key={r.authorName} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex gap-0.5 text-primary">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="mb-5 leading-relaxed">«{r.quote}»</p>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                  {r.authorName[0]}
                </div>
                <div>
                  <div className="font-medium">{r.authorName}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.city} · {r.tripDate}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────── Price + Lead Form

function PriceBlock({ tour }: { tour: Tour }): React.ReactElement {
  const priceLabel = tour.priceToRub
    ? `${formatRub(tour.priceFromRub)} — ${formatRub(tour.priceToRub)} ₽`
    : `от ${formatRub(tour.priceFromRub)} ₽`;

  return (
    <section id="price-block" className="bg-foreground text-background py-20 sm:py-28">
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
            <LeadForm tourSlug={tour.slug} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────── FAQ

function FAQ({ tour }: { tour: Tour }): React.ReactElement {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHead
          eyebrow="Вопросы"
          title="Что обычно спрашивают"
          subtitle="Если вашего вопроса нет — напишите в Telegram, ответим за 2 часа."
          align="center"
        />
        <div className="mt-12 space-y-3">
          {tour.faq.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border bg-card transition hover:border-primary/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
                <span className="font-medium">{item.q}</span>
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-muted-foreground transition group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────── Footer (legal placeholder)

function FooterLegal(): React.ReactElement {
  return (
    <footer className="border-t border-border bg-muted/40 py-12">
      <div className="mx-auto max-w-6xl px-6 text-sm text-muted-foreground">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="font-serif text-xl text-foreground">
              India<em className="text-primary not-italic">Horizone</em>
            </div>
            <p className="mt-3 max-w-xs text-xs">
              Tech-enabled India concierge для русскоязычных клиентов. Не туроператор. Партнёр в
              Индии — IndiaHorizone IN PVT LTD.
            </p>
          </div>
          <div>
            <h6 className="mb-3 font-medium uppercase tracking-wide text-foreground">Компания</h6>
            <ul className="space-y-2 text-xs">
              <li>ИНН/ОГРН: будет добавлен (#306)</li>
              <li>Юр.адрес: будет добавлен</li>
            </ul>
          </div>
          <div>
            <h6 className="mb-3 font-medium uppercase tracking-wide text-foreground">Документы</h6>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/privacy" className="hover:text-primary">
                  Политика конфиденциальности
                </a>{' '}
                <span className="text-muted-foreground/60">(в работе #307)</span>
              </li>
              <li>
                <a href="/consent" className="hover:text-primary">
                  Согласие на обработку ПДн
                </a>
              </li>
              <li>
                <a href="/offer" className="hover:text-primary">
                  Оферта
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-xs">
          © 2026 IndiaHorizone · Made with care · Mumbai → Moscow
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────── Helpers

function SectionHead({
  eyebrow,
  title,
  subtitle,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}): React.ReactElement {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      <div className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </div>
      <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg ${
            align === 'center' ? 'mx-auto' : ''
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function formatRub(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}
