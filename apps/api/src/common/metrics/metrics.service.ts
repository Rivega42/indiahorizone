/**
 * MetricsService — Prometheus metrics baseline (#125).
 *
 * Использует prom-client default registry. При initial start:
 * - collectDefaultMetrics() — Node.js process metrics (eventloop lag,
 *   heap_used, gc_duration_seconds, active_handles, etc.)
 * - http_request_duration_seconds — histogram с лейблами method/route/status
 *
 * Custom metrics добавляются через .registerHistogram/Counter/Gauge —
 * caller'ы (например outbox-relay для outbox_pending_count) импортируют
 * сервис и регистрируют свою метрику.
 *
 * Endpoint /metrics реализуется в MetricsController (защита internal-token).
 */
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry: Registry;
  readonly httpRequestDuration: Histogram<'method' | 'route' | 'status'>;

  constructor() {
    this.registry = new Registry();

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request latency in seconds',
      labelNames: ['method', 'route', 'status'] as const,
      // Buckets подобраны под typical web API: 5ms, 10ms, ..., 5s, 10s.
      // 99% латентности должны попадать в bucket'ы для percentile-аккуратности.
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    // Default metrics: process_*, nodejs_*, gc_*, etc. — стандарт Prom community.
    collectDefaultMetrics({ register: this.registry });
  }

  /**
   * Helper для модулей, которые хотят зарегистрировать свою counter/gauge/histogram.
   * Используется например в outbox-relay для счётчика pending entries.
   */
  registerCounter(opts: { name: string; help: string; labelNames?: string[] }): Counter {
    return new Counter({
      name: opts.name,
      help: opts.help,
      labelNames: opts.labelNames ?? [],
      registers: [this.registry],
    });
  }

  registerGauge(opts: { name: string; help: string; labelNames?: string[] }): Gauge {
    return new Gauge({
      name: opts.name,
      help: opts.help,
      labelNames: opts.labelNames ?? [],
      registers: [this.registry],
    });
  }

  registerHistogram(opts: {
    name: string;
    help: string;
    labelNames?: string[];
    buckets?: number[];
  }): Histogram {
    return new Histogram({
      name: opts.name,
      help: opts.help,
      labelNames: opts.labelNames ?? [],
      ...(opts.buckets ? { buckets: opts.buckets } : {}),
      registers: [this.registry],
    });
  }
}
