import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserStatus, type UserRole } from '@prisma/client';

import { JwtTokenService } from './jwt.service';
import { PasswordService } from './password.service';
import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TwoFaChallengeService } from '../two-fa/two-fa-challenge.service';


import type { LoginDto, LoginResponse, LoginTokenResponse } from '../dto/login.dto';

const GENERIC_INVALID_CREDS = 'Неверный email или пароль';

/**
 * LoginService — authentication flow.
 *
 * Шаги:
 * 1. findUnique по email — если нет, БРОСАЕТ ту же ошибку, что и для wrong password
 *    (anti-enumeration: атакующий не должен узнать, какие email зарегистрированы).
 * 2. argon2id verify пароля — time-constant.
 * 3. Если status=suspended/pending → 401 с generic сообщением (не раскрываем причину).
 * 4. Транзакция:
 *    - INSERT Session (refreshTokenHash = argon2id(refresh_token), ip, ua, expires)
 *    - INSERT outbox auth.user.logged_in
 * 5. Возврат accessToken + refreshToken (plain) + user-info.
 *
 * Rate-limit (10 попыток / 15 мин на email) — в #221 (throttler).
 */
@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly password: PasswordService,
    private readonly jwt: JwtTokenService,
    private readonly twoFaChallenge: TwoFaChallengeService,
  ) {}

  async login(
    dto: LoginDto,
    context: { ip?: string | undefined; userAgent?: string | undefined },
  ): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        passwordHash: true,
        twoFaEnabled: true,
      },
    });

    // Anti-enumeration: даже если user не найден, выполняем dummy-verify, чтобы
    // timing-side-channel не выдал существование email.
    const dummyHash =
      '$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXltb2NraGFzaGRvbnRsb2dpbg$ZHVtbXk';
    const verifyTarget = user?.passwordHash ?? dummyHash;
    const { valid, needsRehash } = await this.password.verify(verifyTarget, dto.password);

    if (!user || !valid) {
      throw new UnauthorizedException(GENERIC_INVALID_CREDS);
    }

    if (user.status !== UserStatus.active) {
      // Suspended/pending — generic message (не раскрываем причину):
      // - suspended → возможно после suspicious-detection (#136), не пишем «вы заблокированы»
      // - pending → email не подтверждён (фаза 4); пока не используется
      this.logger.warn({ userId: user.id, status: user.status }, 'login.blocked');
      throw new UnauthorizedException(GENERIC_INVALID_CREDS);
    }

    // Silent password rehash, если параметры argon устарели
    if (needsRehash) {
      const newHash = await this.password.hash(dto.password);
      await this.prisma.user
        .update({ where: { id: user.id }, data: { passwordHash: newHash } })
        .catch((err: unknown) => this.logger.warn({ err, userId: user.id }, 'rehash.failed'));
    }

    // 2FA fork: пароль верный, но второй фактор требуется. Создаём challenge,
    // токены НЕ выпускаем. Юзер пройдёт POST /auth/2fa/verify (#133).
    if (user.twoFaEnabled) {
      const challengeId = await this.twoFaChallenge.create({
        userId: user.id,
        ...(context.ip !== undefined ? { ip: context.ip } : {}),
        ...(context.userAgent !== undefined ? { userAgent: context.userAgent } : {}),
      });
      this.logger.log({ userId: user.id, challengeId }, 'auth.login.2fa-challenge');
      return { challengeId };
    }

    return this.issueTokensForUser(user, context);
  }

  /**
   * Выпуск JWT-токенов + создание Session + outbox.
   * Используется в успешном /login (без 2FA) и в /auth/2fa/verify после
   * подтверждения второго фактора (#133).
   */
  async issueTokensForUser(
    user: { id: string; email: string; role: UserRole },
    context: { ip?: string | undefined; userAgent?: string | undefined },
  ): Promise<LoginTokenResponse> {
    const refresh = this.jwt.generateRefresh();
    const refreshHash = await this.password.hash(refresh.random);

    // Транзакция: создаём Session + публикуем auth.user.logged_in
    const sessionId = await this.prisma.$transaction(async (tx) => {
      const session = await tx.session.create({
        data: {
          userId: user.id,
          refreshTokenHash: refreshHash,
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
          expiresAt: refresh.expiresAt,
        },
        select: { id: true },
      });

      await this.outbox.add(tx, {
        type: 'auth.user.logged_in',
        schemaVersion: 1,
        actor: { type: 'user', id: user.id },
        payload: {
          userId: user.id,
          sessionId: session.id,
          ip: context.ip,
          userAgent: context.userAgent,
        },
      });

      return session.id;
    });

    const access = this.jwt.signAccess({ userId: user.id, sessionId, role: user.role });

    this.logger.log({ userId: user.id, sessionId }, 'auth.user.logged_in');

    return {
      accessToken: access,
      refreshToken: this.jwt.composeRefresh(sessionId, refresh.random),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
