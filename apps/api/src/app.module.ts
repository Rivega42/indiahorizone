import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CommonAuthModule } from './common/auth/auth.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { EventsBusModule } from './common/events-bus/events-bus.module';
import { LoggerModule } from './common/logger/logger.module';
import { MetricsMiddleware } from './common/metrics/metrics.middleware';
import { MetricsModule } from './common/metrics/metrics.module';
import { OutboxModule } from './common/outbox/outbox.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { ThrottleModule } from './common/throttle/throttle.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ClientsModule } from './modules/clients/clients.module';
import { CommModule } from './modules/comm/comm.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { HealthModule } from './modules/health/health.module';
import { LeadsModule } from './modules/leads/leads.module';
import { MediaModule } from './modules/media/media.module';
import { TripsModule } from './modules/trips/trips.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    LoggerModule, // pino + correlation-id (#124) — должен быть выше остальных
    MetricsModule, // Prometheus metrics + /metrics endpoint (#125)
    CryptoModule, // global, нужен PrismaService в фазе 4 + ClientsService уже сейчас (#139)
    PrismaModule,
    RedisModule,
    ThrottleModule, // global rate-limit (#221)
    EventsBusModule,
    OutboxModule,
    AuthModule,
    ClientsModule,
    CatalogModule,
    LeadsModule,
    TripsModule,
    CommModule,
    FeedbackModule,
    MediaModule,
    AuditModule,
    CommonAuthModule, // глобальный JwtAuthGuard, требует AuthModule (JwtTokenService)
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // HTTP request duration metric — на все routes (#125)
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
