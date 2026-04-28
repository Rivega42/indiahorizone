/**
 * PasswordResetService — flow восстановления пароля через email (#134).
 *
 * Шаги:
 * 1. requestReset(email) — anti-enumeration ВСЕГДА возвращает success.
 *    Если user существует — генерим UUIDv4 token, хешируем (argon2id),
 *    сохраняем PasswordResetToken (TTL 30 мин) и шлём email через NotifyService.
 *    Если user НЕ существует — НИЧЕГО не делаем (тихо). Атакующий не различит.
 *
 * 2. confirmReset(token, newPassword) — валидация + смена пароля + invalidate.
 *    - Linear search по неиспользованным токенам user'а через argon2.verify
 *      (здесь user'а получаем NОT через email, а через проверку всех hash'ей —
 *      это race-safe и не позволяет обойти anti-enumeration).
 *    - При успехе: usedAt=now, обновляем User.passwordHash, revokeAll Session'ов,
 *      публикуем auth.password.changed через outbox.
 *
 * Race-safety: usedAt помечается через UPDATE WHERE id=X AND used_at IS NULL.
 * Параллельный confirm с тем же токеном получит count=0 → 401.
 */
import { randomUUID } from 'node:crypto';

import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotifyService } from '../../comm/notify.service';
import { PasswordService } from '../services/password.service';

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 минут
const GENERIC_INVALID = 'Невалидный или истёкший токен';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly outbox: OutboxService,
    private readonly notify: NotifyService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Запрос на сброс пароля. Anti-enumeration: всегда 204, никогда не leak'аем
   * существование email'а. Email отправляется реально только если user найден.
   */
  async requestReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      this.logger.debug({ email }, 'password-reset.user-not-found');
      return; // тихо — anti-enumeration
    }

    const plainToken = randomUUID();
    const tokenHash = await this.password.hash(plainToken);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const appUrl = this.config.get<string>('APP_URL', 'https://indiahorizone.ru');
    const resetUrl = `${appUrl}/reset-password?token=${plainToken}`;

    try {
      await this.notify.send({
        channel: 'email',
        to: user.email,
        templateId: 'password-reset',
        data: { resetUrl },
        userId: user.id,
      });
    } catch (err) {
      // Email-fail НЕ должен ломать UX (всё равно 204).
      // В логах видно — Вика разберёт через NotifyService failed-events.
      this.logger.error({ err, userId: user.id }, 'password-reset.email-send.failed');
    }

    this.logger.log({ userId: user.id }, 'password-reset.token-issued');
  }

  /**
   * Подтверждение сброса. Меняет пароль + инвалидирует ВСЕ сессии user'а.
   *
   * Anti-enumeration не нужен — здесь не email, а UUID. Атакующий не получит
   * информации о существовании email через token-based endpoint.
   */
  async confirmReset(token: string, newPassword: string): Promise<void> {
    const strength = this.password.checkStrength(newPassword);
    if (!strength.ok) {
      const hint =
        strength.warning ?? strength.suggestions[0] ?? 'добавь длины и непредсказуемых символов';
      throw new BadRequestException(`Пароль слишком слабый: ${hint}`);
    }

    // Ищем активные (не истёкшие, не использованные) токены и проверяем каждый.
    // Argon2.verify — медленный, но активных токенов на user'а обычно 1-2 штуки.
    // Если будет много — добавим extra index или TTL-cleanup chasing.
    const candidates = await this.prisma.passwordResetToken.findMany({
      where: {
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true, tokenHash: true },
    });

    for (const candidate of candidates) {
      const { valid } = await this.password.verify(candidate.tokenHash, token);
      if (!valid) continue;

      // Race-safe claim
      const claimed = await this.prisma.passwordResetToken.updateMany({
        where: { id: candidate.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count === 0) {
        // Параллельный confirm уже использовал этот токен.
        throw new UnauthorizedException(GENERIC_INVALID);
      }

      const newHash = await this.password.hash(newPassword);

      // Транзакция: обновить пароль + invalidate все сессии + outbox event.
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: candidate.userId },
          data: { passwordHash: newHash },
        });

        // Инвалидируем все активные сессии (force re-login на всех устройствах).
        // Critical при reset — атакующий мог иметь украденный refresh-token.
        await tx.session.updateMany({
          where: { userId: candidate.userId, revokedAt: null },
          data: { revokedAt: new Date(), revokeReason: 'password-reset' },
        });

        await this.outbox.add(tx, {
          type: 'auth.password.changed',
          schemaVersion: 1,
          actor: { type: 'user', id: candidate.userId },
          payload: {
            userId: candidate.userId,
            method: 'reset-via-email',
          },
        });
      });

      this.logger.log({ userId: candidate.userId }, 'password-reset.confirmed');
      return;
    }

    // Ни один токен не подошёл — generic 401.
    throw new UnauthorizedException(GENERIC_INVALID);
  }
}
