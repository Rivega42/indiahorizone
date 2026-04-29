/**
 * Seed туров — идемпотентный upsert по slug.
 *
 * Запуск:
 *   pnpm --filter @indiahorizone/api db:seed:tours
 *
 * Идея: первый тур (Керала) живёт в JSON, заводится через seed.
 * Когда сделаем админку (EPIC 13 — Admin Panel), туры будут создаваться
 * через UI и seed станет ненужным. До этого — единственный способ
 * наполнить публичный каталог.
 *
 * Идемпотентность: для каждого тура — upsert по slug, для дней — upsert по
 * (tourId, dayNumber). Можно перезапускать без побочек.
 *
 * Issue: #295 [12.2]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { PrismaClient, type Prisma, type TourStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface TourDayJson {
  dayNumber: number;
  location: string;
  title: string;
  description: string;
  activities: { kind: string; label: string }[];
  imageUrl: string;
  isOptional?: boolean;
  costInrFrom?: number;
  costInrTo?: number;
}

interface TourJson {
  slug: string;
  status: TourStatus;
  title: string;
  region: string;
  durationDays: number;
  season: string;
  priceFromRub: number;
  priceToRub?: number;
  groupSize: string;
  heroVideoUrl?: string;
  heroPosterUrl: string;
  emotionalHook: string;
  trustBadges: string[];
  facts: { iconKind: string; label: string; value: string }[];
  inclusions: { included: string[]; notIncluded: string[] };
  faq: { q: string; a: string }[];
  days: TourDayJson[];
}

/**
 * Auto-discovery всех `*.json` в директории seed/tours/.
 * Drop new tour file → run seed → готово, без изменения кода.
 * См. apps/api/prisma/seed/tours/README.md.
 */
const TOURS_DIR = join(__dirname, 'tours');
const TOUR_FILES = readdirSync(TOURS_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => `tours/${f}`)
  .sort();

async function seedTour(file: string): Promise<void> {
  const path = join(__dirname, file);
  const data = JSON.parse(readFileSync(path, 'utf8')) as TourJson;

  const tourPayload = {
    slug: data.slug,
    status: data.status,
    title: data.title,
    region: data.region,
    durationDays: data.durationDays,
    season: data.season,
    priceFromRub: data.priceFromRub,
    priceToRub: data.priceToRub ?? null,
    groupSize: data.groupSize,
    heroVideoUrl: data.heroVideoUrl ?? null,
    heroPosterUrl: data.heroPosterUrl,
    emotionalHook: data.emotionalHook,
    inclusions: data.inclusions as unknown as Prisma.InputJsonValue,
    faq: data.faq as unknown as Prisma.InputJsonValue,
    trustBadges: data.trustBadges as unknown as Prisma.InputJsonValue,
    facts: data.facts as unknown as Prisma.InputJsonValue,
    publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
  };

  const tour = await prisma.tour.upsert({
    where: { slug: data.slug },
    create: tourPayload,
    update: tourPayload,
    select: { id: true, slug: true },
  });

  for (const day of data.days) {
    await prisma.tourDay.upsert({
      where: { tourId_dayNumber: { tourId: tour.id, dayNumber: day.dayNumber } },
      create: {
        tourId: tour.id,
        dayNumber: day.dayNumber,
        location: day.location,
        title: day.title,
        description: day.description,
        activities: day.activities,
        imageUrl: day.imageUrl,
        isOptional: day.isOptional ?? false,
        costInrFrom: day.costInrFrom ?? null,
        costInrTo: day.costInrTo ?? null,
      },
      update: {
        location: day.location,
        title: day.title,
        description: day.description,
        activities: day.activities,
        imageUrl: day.imageUrl,
        isOptional: day.isOptional ?? false,
        costInrFrom: day.costInrFrom ?? null,
        costInrTo: day.costInrTo ?? null,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`✓ tour seeded: ${tour.slug} (${data.days.length} days)`);
}

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🌱 seeding tours…');
  for (const file of TOUR_FILES) {
    await seedTour(file);
  }
  // eslint-disable-next-line no-console
  console.log('✓ tours seeded');
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error('seed failed:', err);
    void prisma.$disconnect().finally(() => process.exit(1));
  });
