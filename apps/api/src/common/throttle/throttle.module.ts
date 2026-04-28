/**
 * ThrottleModule — global rate-limiting через @nestjs/throttler с Redis store (#221).
 *
 * Зарегистрирован глобально через APP_GUARD → ThrottlerGuard. Все endpoint'ы
 * получают rate-limit по умолчанию `api` (100/min). Эндпоинты с @Throttle
 * декоратором используют именованный профиль.
 *
 * Tracker (по чему лимитим): IP — для всех unauthenticated; userId — для
 * authenticated. Логика в ThrottlerGuard (custom guard для гибкости в будущем).
 *
 * Bypass:
 * - @SkipThrottle() на конкретных endpoint'ах (например /health)
 * - Internal-tokens (например в #220 secrets-management) — отдельный header,
 *   обработка в guard. Сейчас не реализовано (нет internal-tokens пока).
 *
 * См. apps/api/src/common/throttle/throttle.config.ts.
 */
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { THROTTLE_PROFILES } from './throttle.config';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: THROTTLE_PROFILES,
        // Redis-backed storage для distributed rate-limit (несколько api-инстансов
        // в фазе 4 будут видеть один и тот же счётчик).
        storage: new ThrottlerStorageRedisService(
          config.get<string>('REDIS_URL', 'redis://localhost:6379'),
        ),
        // Skip throttle для internal-traffic (Docker network, healthchecks,
        // monitoring). Доменное имя `localhost`/`127.0.0.1` — для health-probe
        // в контейнере. Никогда не доверяем X-Forwarded-For как источнику IP.
        skipIf: (context): boolean => {
          const req = context.switchToHttp().getRequest<{
            ip?: string;
            socket?: { remoteAddress?: string };
          }>();
          const ip = req.ip ?? req.socket?.remoteAddress ?? '';
          return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
        },
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ThrottleModule {}
