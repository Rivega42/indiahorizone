import { type ExecutionContext, SetMetadata, createParamDecorator } from '@nestjs/common';

import type { Request } from 'express';
import type { UserRole } from '@prisma/client';

import type { AuthenticatedUser } from './types';

/**
 * Метаданные для guards.
 */
export const ROLES_KEY = 'roles';
export const PUBLIC_KEY = 'isPublic';

/**
 * @Roles('admin', 'concierge') — требует одну из перечисленных ролей.
 * Если декоратор не применён И @Public() тоже не применён — by default
 * требуется аутентификация без role-restriction (любой залогиненный).
 */
export const Roles = (...roles: UserRole[]): MethodDecorator =>
  SetMetadata(ROLES_KEY, roles);

/**
 * @Public() — endpoint доступен без аутентификации.
 * Используется на /auth/register, /auth/login, /health, /readiness.
 * При сочетании с @Roles() — @Public() приоритетнее (Roles игнорируются).
 */
export const Public = (): MethodDecorator => SetMetadata(PUBLIC_KEY, true);

/**
 * @CurrentUser() — извлекает req.user в параметре controller-метода.
 *
 *   @Get('me')
 *   me(@CurrentUser() user: AuthenticatedUser) { ... }
 *
 * Возвращает null, если endpoint @Public() и токен не приходил.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | null => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.user ?? null;
  },
);
