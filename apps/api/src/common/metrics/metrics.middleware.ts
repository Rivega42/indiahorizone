/**
 * HTTP request duration middleware (#125).
 *
 * При каждом HTTP-запросе:
 * 1. Запускает таймер
 * 2. По завершении ответа фиксирует latency в histogram'е с лейблами:
 *    - method: GET/POST/PATCH/DELETE
 *    - route: matched Express route (например /clients/me, /trips/:id/itinerary)
 *      → cardinality controlled, не взрывается от ID'ов
 *    - status: 2xx/4xx/5xx
 *
 * Регистрируется в AppModule через apply(MetricsMiddleware).forRoutes('*').
 */
import { Injectable, type NestMiddleware } from '@nestjs/common';

import { MetricsService } from './metrics.service';

import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startNs = process.hrtime.bigint();

    res.on('finish', () => {
      const endNs = process.hrtime.bigint();
      const durationSec = Number(endNs - startNs) / 1e9;

      // Express заполняет req.route после matching'а — берём path шаблон.
      // Если route нет (404, /metrics direct hit) — используем 'unknown'.
      const route =
        (req as unknown as { route?: { path?: string } }).route?.path ??
        // fallback на baseUrl + path для unmatched
        (req.originalUrl ?? req.url ?? '').split('?')[0] ??
        'unknown';

      this.metrics.httpRequestDuration.observe(
        {
          method: req.method,
          route: typeof route === 'string' ? route : 'unknown',
          status: String(res.statusCode),
        },
        durationSec,
      );
    });

    next();
  }
}
