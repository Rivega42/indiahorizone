import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';

import { JwtTokenService } from './jwt.service';
import { PasswordService } from './password.service';
import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

import type { RefreshDto, RefreshResponse } from '../dto/refresh.dto';

const GENERIC_INVALID = 'Невалидный или истёкший refresh-токен';

/**
 * RefreshService — refresh-token rotation + reuse-detection.
 *
 * Поток:
 * 1. Парсим refresh-token (формат `<sessionId>.<random>`).
 * 2. Lookup Session по id (O(1)).
 * 3. Если session НЕ найдена → 401 generic.
 * 4. Если session.revokedAt НЕ null → ⚠️ REUSE ATTEMPT:
 *    - Refresh уже был использован один раз и rotated. Повторное использование
 *      того же refresh-токена = либо token leak (атака), либо race-condition
 *      из честного клиента.
 *    - Стандартная реакция: invalidate ВСЕ активные сессии user'а
 *      (logout-all). Это жёстко, но единственный способ защититься от
 *      украденного refresh.
 *    - Публикуем auth.session.suspicious для алерта (#136).
 *    - 401 generic.
 * 5. Если session.expiresAt < now → 401.
 * 6. Если user.status != active → 401.
 * 7. argon2.verify(session.refreshTokenHash, random) → 401 generic если invalid.
 * 8. Транзакция:
 *    - revoke текущую session (revokedAt + revokeReason='rotated')
 *    - create новую Session с новым refreshHash, ip, ua
 *    - outbox auth.session.refreshed
 * 9. Возврат {accessToken: новый JWT, refreshToken: `<newSessionId>.<newRandom>`}
 *
 * Соответствует docs/BACKLOG/M5/B_AUTH.md § B-004.
 */
@Injectable()
export class RefreshService {
  private readonly logger = new Logger(RefreshService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly password: PasswordService,
    private readonly jwt: JwtTokenService,
  ) {}

  async refresh(
    dto: RefreshDto,
    context: { ip?: string | undefined; userAgent?: string | undefined },
  ): Promise<RefreshResponse> {
    const parsed = this.jwt.parseRefresh(dto.refreshToken);
    if (!parsed) {
      throw new UnauthorizedException(GENERIC_INVALID);
    }

    const session = await this.prisma.session.findUnique({
      where: { id: parsed.sessionId },
      include: { user: { select: { id: true, role: true, status: true } } },
    });

    if (!session) {
      this.logger.warn({ sessionId: parsed.sessionId }, 'refresh.session.not-found');
      throw new UnauthorizedException(GENERIC_INVALID);
    }

    // ⚠️ Reuse-detection: revoked session используется снова
    if (session.revokedAt) {
      await this.handleReuseAttempt(session.userId, session.id, context);
      throw new UnauthorizedException(GENERIC_INVALID);
    }

    if (session.expiresAt < new Date()) {
      this.logger.debug({ sessionId: session.id }, 'refresh.session.expired');
      throw new UnauthorizedException(GENERIC_INVALID);
    }

    if (session.user.status !== UserStatus.active) {
      this.logger.warn(
        { userId: session.userId, status: session.user.status },
        'refresh.user.not-active',
      );
      throw new UnauthorizedException(GENERIC_INVALID);
    }

    const { valid } = await this.password.verify(session.refreshTokenHash, parsed.random);
    if (!valid) {
      this.logger.warn({ sessionId: session.id }, 'refresh.token.mismatch');
      throw new UnauthorizedException(GENERIC_INVALID);
    }

    // ✓ Все проверки пройдены — rotate
    const newRefresh = this.jwt.generateRefresh();
    const newRefreshHash = await this.password.hash(newRefresh.random);

    const newSessionId = await this.prisma.$transaction(async (tx) => {
      // Revoke старую
      await tx.session.update({
        where: { id: session.id },
        data: {
          revokedAt: new Date(),
          revokeReason: 'rotated',
        },
      });

      // Create новую
      const fresh = await tx.session.create({
        data: {
          userId: session.userId,
          refreshTokenHash: newRefreshHash,
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
          expiresAt: newRefresh.expiresAt,
        },
        select: { id: true },
      });

      await this.outbox.add(tx, {
        type: 'auth.session.refreshed',
        schemaVersion: 1,
        actor: { type: 'user', id: session.userId },
        payload: {
          userId: session.userId,
          oldSessionId: session.id,
          newSessionId: fresh.id,
          ip: context.ip,
        },
      });

      return fresh.id;
    });

    // newSessionId известен после INSERT'а — теперь подписываем JWT
    const newAccess = this.jwt.signAccess({
      userId: session.userId,
      sessionId: newSessionId,
      role: session.user.role,
    });

    this.logger.log(
      { userId: session.userId, oldSession: session.id, newSession: newSessionId },
      'auth.session.refreshed',
    );

    return {
      accessToken: newAccess,
      refreshToken: this.jwt.composeRefresh(newSessionId, newRefresh.random),
    };
  }

  /**
   * Reuse-detection — кто-то использовал refresh-токен второй раз.
   * Возможные сценарии:
   * - Атака: refresh-token утёк (XSS, MITM), атакующий пробует rotated токен.
   * - Race: честный клиент сделал два refresh подряд (редко, но возможно
   *   при отключении интернета — клиент думает первый запрос упал, шлёт второй).
   *
   * В обоих случаях безопасно — invalidate ВСЕ активные сессии user'а.
   * Честный клиент пере-логинится; атакующий теряет доступ.
   */
  private async handleReuseAttempt(
    userId: string,
    suspiciousSessionId: string,
    context: { ip?: string | undefined; userAgent?: string | undefined },
  ): Promise<void> {
    this.logger.warn(
      {
        userId,
        sessionId: suspiciousSessionId,
        ip: context.ip,
        ua: context.userAgent,
      },
      'auth.refresh.reuse-detected',
    );

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.session.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokeReason: 'reuse-detected',
        },
      });

      await this.outbox.add(tx, {
        type: 'auth.session.suspicious',
        schemaVersion: 1,
        actor: { type: 'system' },
        payload: {
          userId,
          reason: 'refresh-token-reuse',
          suspiciousSessionId,
          revokedSessionsCount: result.count,
          ip: context.ip,
          userAgent: context.userAgent,
        },
      });
    });
  }
}
