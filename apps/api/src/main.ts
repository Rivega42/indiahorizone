// КРИТИЧНО: tracing/init ДОЛЖЕН быть импортирован ПЕРВЫМ —
// до любых других модулей, которые нужно инструментировать (#223).
// SDK no-op если OTEL_EXPORTER_OTLP_ENDPOINT не задан.
import './common/tracing/init';

import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // bufferLogs=true — pino логгер подменит default ниже, до этого момента
  // логи буферизуются и сбросятся через pino.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Pino logger (#124) с correlation-id и redact ПДн/токенов
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  const port = config.get<number>('API_PORT', 4000);
  const host = config.get<string>('API_HOST', '0.0.0.0');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // отбрасывает поля, которых нет в DTO
      forbidNonWhitelisted: true, // 400 если отправлены неожиданные поля
      transform: true, // превращает plain object → DTO instance, активирует @Transform
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.enableShutdownHooks();

  await app.listen(port, host);
  app.get(Logger).log(`🚀 API listening on http://${host}:${port}`, 'Bootstrap');
}

void bootstrap();
