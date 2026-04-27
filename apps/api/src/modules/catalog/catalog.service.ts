/**
 * CatalogService — read-only бизнес-логика catalog module.
 *
 * Принципы:
 * 1. Возвращает только PUBLISHED туры в публичных методах.
 * 2. Маппит Prisma-модель в DTO, **исключая** internal-поля
 *    (`costInrFrom`/`costInrTo` в TourDay). Это защита от утечки маржи
 *    через Next.js bundle (getStaticProps embed'ит response в HTML).
 * 3. Cross-module rule: catalog независим — без зависимостей на User/Client.
 *
 * Issues: #296 [12.3]
 */
import { Injectable } from '@nestjs/common';


import { PrismaService } from '../../common/prisma/prisma.service';

import type { TourDayDto, TourDetailsDto, TourSummaryDto } from './dto';
import type { Tour, TourDay } from '@prisma/client';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(): Promise<TourSummaryDto[]> {
    const tours = await this.prisma.tour.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
    });
    return tours.map((t) => this.toSummary(t));
  }

  /**
   * Возвращает PUBLISHED тур с днями и медиа. null если slug не найден
   * или тур не PUBLISHED.
   */
  async findBySlug(slug: string): Promise<TourDetailsDto | null> {
    const tour = await this.prisma.tour.findUnique({
      where: { slug },
      include: {
        days: { orderBy: { dayNumber: 'asc' } },
      },
    });

    if (tour?.status !== 'PUBLISHED') return null;

    return this.toDetails(tour, tour.days);
  }

  // ────────────────────────── DTO mapping

  private toSummary(t: Tour): TourSummaryDto {
    return {
      slug: t.slug,
      title: t.title,
      region: t.region,
      durationDays: t.durationDays,
      season: t.season,
      priceFromRub: t.priceFromRub,
      priceToRub: t.priceToRub,
      heroPosterUrl: t.heroPosterUrl,
    };
  }

  private toDetails(t: Tour, days: TourDay[]): TourDetailsDto {
    return {
      ...this.toSummary(t),
      groupSize: t.groupSize,
      heroVideoUrl: t.heroVideoUrl,
      emotionalHook: t.emotionalHook,
      trustBadges: t.trustBadges,
      facts: t.facts,
      inclusions: t.inclusions,
      faq: t.faq,
      days: days.map((d) => this.toDayDto(d)),
    };
  }

  private toDayDto(d: TourDay): TourDayDto {
    return {
      dayNumber: d.dayNumber,
      location: d.location,
      title: d.title,
      description: d.description,
      activities: d.activities,
      imageUrl: d.imageUrl,
      isOptional: d.isOptional,
      // costInrFrom, costInrTo — НЕ включены (internal)
    };
  }
}
