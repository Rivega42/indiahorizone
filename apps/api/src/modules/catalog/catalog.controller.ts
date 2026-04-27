/**
 * CatalogController — публичные read-only endpoints каталога туров.
 *
 * - GET /tours          — список published
 * - GET /tours/:slug    — детали published по slug; 404 если нет/draft
 *
 * Оба `@Public()` — без auth. Кеширование на стороне Next.js через ISR
 * (revalidate=3600 в /tours/[slug]).
 *
 * Issue: #296 [12.3]
 */
import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

import { CatalogService } from './catalog.service';
import { Public } from '../../common/auth/decorators';

import type { TourDetailsDto, TourSummaryDto } from './dto';

@Controller('tours')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get()
  async list(): Promise<TourSummaryDto[]> {
    return this.catalog.listPublished();
  }

  @Public()
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string): Promise<TourDetailsDto> {
    const tour = await this.catalog.findBySlug(slug);
    if (!tour) {
      throw new NotFoundException(`Tour not found: ${slug}`);
    }
    return tour;
  }
}
