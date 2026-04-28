/**
 * OpenTelemetry SDK initialization (#223).
 *
 * **КРИТИЧНО:** этот модуль ДОЛЖЕН быть импортирован ПЕРЕД любым кодом,
 * который нужно инструментировать (express, prisma client, ioredis, http).
 * Поэтому единственный import в main.ts — самым ПЕРВЫМ:
 *
 *   import './common/tracing/init.js';   // ← ДО любых других импортов из NestJS
 *   import 'reflect-metadata';
 *   ...
 *
 * Если не задан `OTEL_EXPORTER_OTLP_ENDPOINT` — SDK не запускается (no-op).
 * Это безопасный default для dev без observability-стэка.
 *
 * Auto-instrumentation:
 * - HTTP (incoming + outgoing fetch/got)
 * - Postgres (через @prisma/instrumentation от Prisma)
 * - Redis (ioredis)
 * - S3 (AWS SDK v3 — auto через @opentelemetry/instrumentation-aws-sdk)
 *
 * Trace context propagation:
 * - W3C `traceparent` header — стандарт, понимают все экспортёры
 * - Автопробрасывается auto-instrument'ами через cls (async-hooks)
 *
 * Exporter:
 * - OTLP/HTTP по умолчанию — большинство collectors поддерживают
 *   (Jaeger, Tempo, Honeycomb, Datadog, etc.)
 * - Endpoint в env: OTEL_EXPORTER_OTLP_ENDPOINT (например http://jaeger:4318)
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

const endpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];

if (endpoint) {
  const serviceName = process.env['OTEL_SERVICE_NAME'] ?? 'indiahorizone-api';
  const serviceVersion = process.env['npm_package_version'] ?? '0.0.0';
  const env = process.env['NODE_ENV'] ?? 'development';

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
      'deployment.environment': env,
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable fs (слишком шумно: каждое чтение файла = span)
        '@opentelemetry/instrumentation-fs': { enabled: false },
        // Disable dns (часто шумит резолвами)
        '@opentelemetry/instrumentation-dns': { enabled: false },
      }),
    ],
  });

  sdk.start();
  // eslint-disable-next-line no-console
  console.log(
    `[otel] SDK started — service=${serviceName} env=${env} → ${endpoint}`,
  );

  // Graceful shutdown — SDK успеет flush'нуть pending spans до process.exit().
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      // eslint-disable-next-line no-console
      .then(() => console.log('[otel] SDK shut down'))
      .catch(
        (err: unknown) =>
          // eslint-disable-next-line no-console
          console.error('[otel] SDK shutdown error', err),
      )
      .finally(() => process.exit(0));
  });
} else {
  // eslint-disable-next-line no-console
  console.log(
    '[otel] OTEL_EXPORTER_OTLP_ENDPOINT не задан — tracing отключён (no-op)',
  );
}
