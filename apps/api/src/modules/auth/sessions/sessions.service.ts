import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { deviceLabel } from './lib/ua-parser';
import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface SessionResponse {
  id: string;
  deviceLabel: string;
  ip: string | null;
  createdAt: Date;
  expiresAt: Date;
  current: boolean;
}

/**
 * SessionsService — управление активными сессиями пользователя (#A-05).
 *
 * Endpoints:
 * - list(userId, currentSessionId) — все active sessions с пометкой current
 * - revoke(userId, sessionId, currentSessionId) — завершить конкретную
 *
 * Active = revokedAt IS NULL AND expiresAt > now.
 * Current сессию помечаем по sessionId из JWT — клиенту не нужно ничего
 * передавать дополнительно.
 *
 * Нельзя revoke текущую сессию через DELETE /auth/sessions/:id (защита от
 * случайного «выхода»): для этого используется POST /auth/logout.
 */
@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  async list(userId: string, currentSessionId: string): Promise<SessionResponse[]> {
    const now = new Date();
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ip: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return sessions.map((s) => ({
      id: s.id,
      deviceLabel: deviceLabel(s.userAgent),
      ip: s.ip,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      current: s.id === currentSessionId,
    }));
  }

  async revoke(userId: string, sessionId: string, currentSessionId: string): Promise<void> {
    if (sessionId === currentSessionId) {
      throw new ForbiddenException(
        'Нельзя завершить текущую сессию через этот endpoint. Используйте /auth/logout.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.session.updateMany({
        where: {
          id: sessionId,
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokeReason: 'revoked-by-user',
        },
      });

      if (result.count === 0) {
        // session не найдена / не принадлежит user'у / уже revoked
        throw new NotFoundException('Сессия не найдена');
      }

      await this.outbox.add(tx, {
        type: 'auth.session.revoked',
        schemaVersion: 1,
        actor: { type: 'user', id: userId },
        payload: {
          userId,
          sessionId,
          reason: 'revoked-by-user',
        },
      });
    });

    this.logger.log({ userId, sessionId }, 'auth.session.revoked');
  }
}
