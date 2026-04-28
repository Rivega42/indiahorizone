/**
 * MetricsModule — Prometheus metrics + middleware + scrape endpoint (#125).
 *
 * Global — MetricsService доступен везде (для регистрации custom метрик
 * каждым модулем).
 *
 * Middleware регистрируется в AppModule через configure(consumer).
 */
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MetricsController } from './metrics.controller';
import { MetricsMiddleware } from './metrics.middleware';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [MetricsController],
  providers: [MetricsService, MetricsMiddleware],
  exports: [MetricsService, MetricsMiddleware],
})
export class MetricsModule {}
