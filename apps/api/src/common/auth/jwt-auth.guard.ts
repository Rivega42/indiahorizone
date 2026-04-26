import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { Request } from 'express';
import type { UserRole } from '@prisma/client';

import { JwtTokenService } from '../../modules/auth/services/jwt.service';

import { PUBLIC_KEY, ROLES_KEY } from './decorators';
import type { AuthenticatedUser } from './types';

/**
 * Глобальный JwtAuthGuard — требует валидный access-token в Authorization
 * header (формат `Bearer <jwt>`). Учитывает @Public() и @Roles().
 *
 * Алгоритм:
 * 1. Если @Public() — пропускаем без проверки.
 * 2. Извлекаем Authorization header. Нет → 401.
 * 3. JwtTokenService.verifyAccess → если null → 401.
 * 4. attach AuthenticatedUser к req.user.
 * 5. Если @Roles(...) — проверяем role payload против списка. Не соответствует
 *    → 403.
 *
 * Регистрируется глобально в AppModule — все controllers защищены по умолчанию,
 * чтобы случайно не оставить unprotected endpoint. Public-endpoints явно
 * помечаются @Public().
 *
 * Соответствует docs/BACKLOG/M5/B_AUTH.md § B-006.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtTokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('Не передан токен авторизации');
    }

    const payload = this.jwt.verifyAccess(token);
    if (!payload) {
      throw new UnauthorizedException('Невалидный или истёкший токен');
    }

    const user: AuthenticatedUser = {
      id: payload.sub,
      sessionId: payload.sid,
      role: payload.role,
    };
    req.user = user;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      this.logger.warn(
        { userId: user.id, role: user.role, required: requiredRoles },
        'rbac.denied',
      );
      throw new ForbiddenException('Недостаточно прав');
    }

    return true;
  }

  private extractToken(req: Request): string | null {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice('Bearer '.length).trim() || null;
  }
}
