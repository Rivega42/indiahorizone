import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CommonAuthModule } from './common/auth/auth.module';
import { EventsBusModule } from './common/events-bus/events-bus.module';
import { OutboxModule } from './common/outbox/outbox.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ClientsModule } from './modules/clients/clients.module';
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
    AuthModule,
    ClientsModule,
    CatalogModule,
    CommonAuthModule, // глобальный JwtAuthGuard, требует AuthModule (JwtTokenService)
    HealthModule,
  ],
})
export class AppModule {}
