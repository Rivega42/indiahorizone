import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

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
  Logger.log(`🚀 API listening on http://${host}:${port}`, 'Bootstrap');
}

void bootstrap();
