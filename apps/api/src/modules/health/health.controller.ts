import { Controller, Get } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

interface HealthStatus {
  status: 'ok';
  uptime: number;
  version: string;
  timestamp: string;
}

interface ReadinessStatus {
  status: 'ready' | 'degraded';
  checks: {
    postgres: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get('health')
  health(): HealthStatus {
    return {
      status: 'ok',
      uptime: process.uptime(),
      version: process.env['npm_package_version'] ?? '0.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  async readiness(): Promise<ReadinessStatus> {
    const [postgresUp, redisUp] = await Promise.all([
      this.prisma.healthcheck(),
      this.redis.healthcheck(),
    ]);

    return {
      status: postgresUp && redisUp ? 'ready' : 'degraded',
      checks: {
        postgres: postgresUp ? 'up' : 'down',
        redis: redisUp ? 'up' : 'down',
      },
    };
  }
}
