import { Controller, Get } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

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
    redis: 'up' | 'down' | 'pending';
  };
}

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

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
  async readiness(): Promise<ReadinessStatus> {
    const postgresUp = await this.prisma.healthcheck();

    // TODO: Redis check появится после #118 (events-bus подключение).
    const redis: 'pending' = 'pending';

    return {
      status: postgresUp ? 'ready' : 'degraded',
      checks: {
        postgres: postgresUp ? 'up' : 'down',
        redis,
      },
    };
  }
}
