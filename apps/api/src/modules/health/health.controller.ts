import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../../common/auth/decorators';
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

/**
 * Health/readiness — НЕ rate-limited (#221): kubernetes/docker liveness-probe
 * могут долбить чаще 100/min, и блокировка приведёт к ложным restart'ам.
 */
@Controller()
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get('health')
  health(): HealthStatus {
    return {
      status: 'ok',
      uptime: process.uptime(),
      version: process.env['npm_package_version'] ?? '0.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
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
