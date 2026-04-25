import { Global, Module } from '@nestjs/common';

import { RedisService } from './redis.service';

/**
 * Global Redis module. Использование:
 *   constructor(private readonly redis: RedisService) {}
 *   await this.redis.getClient().set('key', 'value');
 *
 * Global scope оправдан — Redis нужен в events-bus, кеше, rate-limiter,
 * comm-svc (push/email queues) и т.д.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
