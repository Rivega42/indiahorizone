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
   * Сгенерировать random refresh-токен. Возвращает random-часть (для хеша)
   * и expiresAt. Caller потом composeRefresh(sessionId, random) → клиенту.
   */
  generateRefresh(): { random: string; expiresAt: Date } {
    const random = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const expiresAt = new Date(Date.now() + this.refreshTtlSec * 1000);
    return { random, expiresAt };
  }

  /**
   * Собирает refresh-token, который видит клиент: `<sessionId>.<random>`.
   *
   * sessionId в payload нужен, чтобы при /auth/refresh найти Session
   * за O(1) (lookup by PK), а не перебирать все сессии × argon2.verify
   * (DoS-уязвимо). sessionId не секретен — UUID, угадать невозможно.
   * Хеш в БД argon2(random), не argon2(`${sessionId}.${random}`) — проще.
   */
  composeRefresh(sessionId: string, random: string): string {
    return `${sessionId}.${random}`;
  }

  /**
   * Парсит refresh-токен от клиента. Возвращает null если формат неверный.
   * Не делает verify — только разделяет.
   */
  parseRefresh(token: string): { sessionId: string; random: string } | null {
    const dot = token.indexOf('.');
    if (dot < 0) return null;
    const sessionId = token.slice(0, dot);
    const random = token.slice(dot + 1);
    // Базовая валидация UUID v4 (8-4-4-4-12 hex) и random (hex 128 chars)
    if (!/^[0-9a-f-]{36}$/i.test(sessionId) || !/^[0-9a-f]+$/i.test(random)) {
      return null;
    }
    return { sessionId, random };
  }

  getRefreshTtlMs(): number {
    return this.refreshTtlSec * 1000;
  }
}
