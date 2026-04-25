import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EventsBusModule } from './common/events-bus/events-bus.module';
import { OutboxModule } from './common/outbox/outbox.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    PrismaModule,
    RedisModule,
    EventsBusModule,
    OutboxModule,
    HealthModule,
    AuthModule,
  ],
})
export class AppModule {}
