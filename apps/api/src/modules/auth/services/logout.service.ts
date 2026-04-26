import { Injectable, Logger } from '@nestjs/common';

import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface LogoutContext {
  ip?: string;
  userAgent?: string;
}

/**
 * LogoutService — инвалидация сессий пользователя.
 *
 * - logout(userId, sessionId): revoke только текущую (sessionId из JWT-claim)
 * - logoutAll(userId): revoke все active sessions user'а (включая текущую)
 *
 * Идемпотентность: если session уже revoked — отвечаем 200 без ошибки.
 * Это защита от race-conditions (клиент мог быстро нажать logout дважды).
 *
 * Соответствует docs/BACKLOG/M5/B_AUTH.md § B-005.
 */
@Injectable()
export class LogoutService {
  private readonly logger = new Logger(LogoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Logout текущего устройства.
   * Берёт sessionId из JWT-claim — клиенту НЕ нужно передавать refresh-token.
   */
  async logout(userId: string, sessionId: string, ctx: LogoutContext = {}): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const result = await tx.session.updateMany({
        where: {
          id: sessionId,
          userId, // защита: нельзя revoke чужую сессию даже зная её id
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokeReason: 'logout',
        },
      });

      if (result.count === 0) {
        // session уже revoked или не принадлежит user'у — idempotent, не error
        return;
      }

      await this.outbox.add(tx, {
        type: 'auth.user.logout',
        schemaVersion: 1,
        actor: { type: 'user', id: userId },
        payload: {
          userId,
          sessionId,
          scope: 'current',
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        },
      });
    });

    this.logger.log({ userId, sessionId }, 'auth.user.logout.current');
  }

  /**
   * Logout со всех устройств. Пользователь должен пере-логиниться везде.
   * Используется при reset password (#134), suspicious-session «не я» (#136),
   * или из UI настроек безопасности.
   */
  async logoutAll(userId: string, ctx: LogoutContext = {}): Promise<{ revokedCount: number }> {
    const revokedCount = await this.prisma.$transaction(async (tx) => {
      const result = await tx.session.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokeReason: 'logout-all',
        },
      });

      if (result.count > 0) {
        await this.outbox.add(tx, {
          type: 'auth.user.logout',
          schemaVersion: 1,
          actor: { type: 'user', id: userId },
          payload: {
            userId,
            scope: 'all',
            revokedCount: result.count,
            ip: ctx.ip,
            userAgent: ctx.userAgent,
          },
        });
      }

      return result.count;
    });

    this.logger.log({ userId, revokedCount }, 'auth.user.logout.all');
    return { revokedCount };
  }
}
