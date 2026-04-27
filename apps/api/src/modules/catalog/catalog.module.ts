/**
 * CatalogModule — публичный read-only catalog tours.
 *
 * - GET /tours, /tours/:slug
 * - В будущем: подписки на admin-cache invalidation, расширение на /destinations
 *
 * Issues: #296 [12.3], EPIC #293
 */
import { Module } from '@nestjs/common';


import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
