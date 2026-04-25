import { randomBytes } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';

import type { UserRole } from '@prisma/client';

const REFRESH_TOKEN_BYTES = 64; // 64 байта = 128 hex-символов = 512 бит энтропии

export interface AccessTokenPayload {
  sub: string; // userId
  role: UserRole;
  type: 'access';
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: never; // hash hides — see method below
}

/**
 * JwtTokenService — выпуск/верификация JWT access-токенов и random refresh-токенов.
 *
 * Принципы:
 * - Access-токен: JWT, 15 минут TTL, содержит role-claim для RBAC
 * - Refresh-токен: random 64-byte, передаётся клиенту в plain, в БД сохраняется
 *   только argon2id-хеш. Сам JWT не используется — random проще, надёжнее
 *   против JWT-attacks (algorithm confusion и т.д.).
 * - Refresh-rotation реализуется в RefreshService (#129). Этот сервис только
 *   генерирует/верифицирует, не управляет lifecycle.
 */
@Injectable()
export class JwtTokenService {
  private readonly logger = new Logger(JwtTokenService.name);
  private readonly accessTtlSec: number;
  private readonly refreshTtlSec: number;
  private readonly accessSecret: string;

  constructor(
    private readonly nestJwt: NestJwtService,
    config: ConfigService,
  ) {
    this.accessTtlSec = parseInt(config.get<string>('JWT_ACCESS_TTL_SEC', '900'), 10); // 15 мин
    this.refreshTtlSec = parseInt(
      config.get<string>('JWT_REFRESH_TTL_SEC', String(30 * 24 * 60 * 60)), // 30 дней
      10,
    );
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      this.logger.warn('JWT_SECRET not set — using dev-default. NEVER do this in production.');
    }
    this.accessSecret = secret ?? 'dev-only-jwt-secret-change-me';
  }

  /**
   * Выпустить access-токен (JWT) для user'а.
   */
  signAccess(payload: { userId: string; role: UserRole }): string {
    const claims: AccessTokenPayload = {
      sub: payload.userId,
      role: payload.role,
      type: 'access',
    };
    return this.nestJwt.sign(claims, {
      secret: this.accessSecret,
      expiresIn: this.accessTtlSec,
    });
  }

  /**
   * Верифицировать access-токен. Возвращает payload или null.
   */
  verifyAccess(token: string): AccessTokenPayload | null {
    try {
      const payload = this.nestJwt.verify<AccessTokenPayload>(token, {
        secret: this.accessSecret,
      });
      if (payload.type !== 'access') {
        this.logger.warn({ type: payload.type }, 'jwt.wrong-type');
        return null;
      }
      return payload;
    } catch (error) {
      this.logger.debug({ err: error }, 'jwt.verify.failed');
      return null;
    }
  }

  /**
   * Сгенерировать random refresh-токен. Возвращает plain токен (для клиента)
   * и его длительность. Хеширование делается caller'ом через PasswordService.
   */
  generateRefresh(): { token: string; expiresAt: Date } {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const expiresAt = new Date(Date.now() + this.refreshTtlSec * 1000);
    return { token, expiresAt };
  }

  getRefreshTtlMs(): number {
    return this.refreshTtlSec * 1000;
  }
}
