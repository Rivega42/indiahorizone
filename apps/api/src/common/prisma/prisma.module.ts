import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * Global Prisma module. Зарегистрирован один раз в AppModule, использовать
 * через DI: `constructor(private readonly prisma: PrismaService) {}`.
 *
 * Global scope оправдан — Prisma это инфраструктурный сервис, нужен почти
 * во всех модулях. Альтернатива (importing PrismaModule в каждом модуле)
 * — лишний boilerplate.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
