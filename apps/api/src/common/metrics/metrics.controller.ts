/**
 * GET /metrics — Prometheus scrape endpoint (#125).
 *
 * Защита: header `X-Internal-Token` должен совпадать с env METRICS_TOKEN.
 * Если METRICS_TOKEN не задан — endpoint полностью отключён (403 для всех).
 *
 * Это **не endpoint для пользователей** — Prometheus / VictoriaMetrics scrape'ит
 * отсюда метрики. Доступен ТОЛЬКО Viка через docker network (или внешний
 * Prometheus с правильным токеном).
 *
 * Не rate-limited (исключим в throttle.config skipIf), не audited.
 */
import { Controller, ForbiddenException, Get, Headers, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';

import { MetricsService } from './metrics.service';
import { Public } from '../auth/decorators';

import type { Response } from 'express';

@Controller()
@SkipThrottle()
export class MetricsController {
  constructor(
    private readonly metrics: MetricsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Prometheus default content-type: `text/plain; version=0.0.4; charset=utf-8`
   * (важно — Prometheus отказывается парсить если другой).
   */
  @Public()
  @Get('metrics')
  async scrape(
    @Headers('x-internal-token') token: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const expected = this.config.get<string>('METRICS_TOKEN');
    if (!expected) {
      // Endpoint полностью disabled — METRICS_TOKEN обязателен в prod.
      // В dev'е без переменной получим 403; Викa добавит при первом scrape.
      throw new ForbiddenException('Metrics endpoint disabled (METRICS_TOKEN not set)');
    }
    if (token !== expected) {
      throw new ForbiddenException('Invalid X-Internal-Token');
    }

    const body = await this.metrics.registry.metrics();
    res.setHeader('Content-Type', this.metrics.registry.contentType);
    res.send(body);
  }
}
