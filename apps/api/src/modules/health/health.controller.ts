import { Controller, Get } from '@nestjs/common';

interface HealthStatus {
  status: 'ok';
  uptime: number;
  version: string;
  timestamp: string;
}

interface ReadinessStatus {
  status: 'ready' | 'degraded';
  checks: {
    postgres: 'up' | 'down' | 'pending';
    redis: 'up' | 'down' | 'pending';
  };
}

@Controller()
export class HealthController {
  @Get('health')
  health(): HealthStatus {
    return {
      status: 'ok',
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? '0.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  readiness(): ReadinessStatus {
    // TODO: реальные проверки Postgres + Redis появятся после
    // подключения PrismaService (#117) и RedisService (#118).
    // Пока возвращаем 'pending' — это валидный signal, что зависимости
    // ещё не инициализированы.
    return {
      status: 'ready',
      checks: {
        postgres: 'pending',
        redis: 'pending',
      },
    };
  }
}
