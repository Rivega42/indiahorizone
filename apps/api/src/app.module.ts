import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CommonAuthModule } from './common/auth/auth.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { EventsBusModule } from './common/events-bus/events-bus.module';
import { OutboxModule } from './common/outbox/outbox.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    CryptoModule, // global, нужен PrismaService в фазе 4 + ClientsService уже сейчас (#139)
    PrismaModule,
    RedisModule,
    EventsBusModule,
    OutboxModule,
    AuthModule,
    ClientsModule,
    CommonAuthModule, // глобальный JwtAuthGuard, требует AuthModule (JwtTokenService)
    HealthModule,
  ],
})
export class AppModule {}
