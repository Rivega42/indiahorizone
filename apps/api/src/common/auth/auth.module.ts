import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule as AuthFeatureModule } from '../../modules/auth/auth.module';

import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Common Auth Module — регистрирует глобальный JwtAuthGuard.
 *
 * Импортирует AuthFeatureModule (modules/auth) чтобы получить доступ к
 * JwtTokenService для verify access-токенов.
 *
 * Все controllers по умолчанию защищены этим guard'ом. Public endpoints
 * (login, register, health) явно помечаются @Public() декоратором.
 */
@Global()
@Module({
  imports: [AuthFeatureModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [],
})
export class CommonAuthModule {}

export { JwtAuthGuard } from './jwt-auth.guard';
export { Public, Roles, CurrentUser, ROLES_KEY, PUBLIC_KEY } from './decorators';
export type { AuthenticatedUser } from './types';
