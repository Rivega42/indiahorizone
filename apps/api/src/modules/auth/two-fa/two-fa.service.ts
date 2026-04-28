/**
 * TwoFaService — TOTP-based 2FA enrollment.
 *
 * Поток (issue #132):
 * 1. POST /auth/2fa/enroll: генерируем secret + URL, шифруем и сохраняем
 *    в User.twoFaSecret, НО twoFaEnabled остаётся false. Юзер сканирует QR
 *    в authenticator (Google Authenticator, Authy, 1Password).
 * 2. POST /auth/2fa/verify-enroll: юзер вводит 6-значный код, мы проверяем
 *    по сохранённому секрету. При успехе:
 *    - twoFaEnabled = true
 *    - генерируем 10 recovery codes, хешируем через argon2id, сохраняем
 *    - возвращаем plaintext recovery codes ОДИН раз
 *    - публикуем `auth.2fa.enabled` через outbox
 *
 * Disable 2FA — отдельный endpoint (вне scope #132).
 * 2FA verify при login — отдельный поток (#133).
 */
import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { generateSecret, generateURI, verifySync } from 'otplib';

import { LoginService } from '../services/login.service';
import { PasswordService } from '../services/password.service';
import { CryptoService } from '../../../common/crypto/crypto.service';
import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TwoFaChallengeService } from './two-fa-challenge.service';

import type { LoginTokenResponse } from '../dto/login.dto';
import type { EnrollResponse, VerifyEnrollResponse } from './dto/verify-enroll.dto';

const TOTP_ISSUER = 'IndiaHorizone';
/** TOTP step (RFC 6238 default 30 sec) — оставляем дефолт. */
const RECOVERY_CODES_COUNT = 10;
/** 8 байт = 16 hex-символов — 64 бита энтропии на код. */
const RECOVERY_CODE_BYTES = 8;

@Injectable()
export class TwoFaService {
  private readonly logger = new Logger(TwoFaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly password: PasswordService,
    private readonly outbox: OutboxService,
    private readonly challenge: TwoFaChallengeService,
    // forwardRef — LoginService инжектит TwoFaChallengeService, а TwoFaService
    // (этот класс) инжектит LoginService.issueTokensForUser. NestJS DI требует
    // явного forwardRef для разрыва circular dependency.
    @Inject(forwardRef(() => LoginService))
    private readonly login: LoginService,
  ) {}

  /**
   * Шаг 1: сгенерировать TOTP secret + сохранить (encrypted) на User.
   *
   * Идемпотентен НЕ полностью: при повторном вызове генерируется НОВЫЙ secret
   * (старый перезаписывается). Это безопасно — юзер не подтвердил старый, значит
   * никто не настроил authenticator со старым секретом.
   *
   * @throws ConflictException если 2FA уже активирован
   * @throws NotFoundException если user не найден
   */
  async startEnrollment(userId: string): Promise<EnrollResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, twoFaEnabled: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.twoFaEnabled) {
      throw new ConflictException('2FA уже активирован. Сначала отключите текущий setup.');
    }

    const secret = generateSecret(); // base32, RFC 6238 default
    const otpAuthUrl = generateURI({
      label: user.email,
      issuer: TOTP_ISSUER,
      secret,
      // strategy default = 'totp'
    });

    const encryptedSecret = this.crypto.encrypt(secret);

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFaSecret: encryptedSecret },
    });

    this.logger.log({ userId }, 'auth.2fa.enroll.started');

    return { secret, otpAuthUrl };
  }

  /**
   * Шаг 2: проверить TOTP код и активировать 2FA.
   *
   * При успехе:
   * - twoFaEnabled = true
   * - 10 recovery codes генерируются + хешируются (argon2id) + сохраняются
   * - публикуется auth.2fa.enabled
   * - возвращаются plaintext коды (ОДИН раз)
   *
   * @throws NotFoundException если у user нет начатого enroll'а
   * @throws ConflictException если 2FA уже активирован
   * @throws UnauthorizedException если TOTP код неверен
   */
  async completeEnrollment(userId: string, code: string): Promise<VerifyEnrollResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFaEnabled: true, twoFaSecret: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.twoFaEnabled) {
      throw new ConflictException('2FA уже активирован');
    }
    if (!user.twoFaSecret) {
      throw new BadRequestException(
        'Enroll не начат — сначала вызовите POST /auth/2fa/enroll',
      );
    }

    const secret = this.crypto.decrypt(user.twoFaSecret);
    const result = verifySync({ secret, token: code });
    if (!result.valid) {
      this.logger.warn({ userId }, 'auth.2fa.verify-enroll.invalid-code');
      throw new UnauthorizedException('Неверный TOTP код');
    }

    // Генерируем recovery codes ДО транзакции (хеширование медленное — argon2id).
    const plaintextCodes: string[] = [];
    const codeHashes: string[] = [];
    for (let i = 0; i < RECOVERY_CODES_COUNT; i++) {
      const plaintext = this.generateRecoveryCode();
      plaintextCodes.push(plaintext);
      codeHashes.push(await this.password.hash(plaintext));
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { twoFaEnabled: true },
      });

      // Защитная очистка старых неиспользованных recovery codes (regenerate-сценарий).
      // Сейчас не нужно — мы пришли через enroll-flow, ранее не было активации.
      // Но если в будущем добавим regenerate — этот шаг становится критичным.
      await tx.recoveryCode.deleteMany({ where: { userId } });

      await tx.recoveryCode.createMany({
        data: codeHashes.map((codeHash) => ({ userId, codeHash })),
      });

      await this.outbox.add(tx, {
        type: 'auth.2fa.enabled',
        schemaVersion: 1,
        actor: { type: 'user', id: userId },
        payload: {
          userId,
          recoveryCodesGenerated: RECOVERY_CODES_COUNT,
        },
      });
    });

    this.logger.log({ userId }, 'auth.2fa.enabled');
    return { recoveryCodes: plaintextCodes };
  }

  /**
   * 2FA verify при login (#133).
   *
   * Flow:
   * 1. Получаем challenge из Redis по challengeId — incr attempts.
   * 2. Если challenge не найден ИЛИ attempts > MAX → 401.
   * 3. Определяем формат code: 6 цифр → TOTP, иначе → recovery.
   * 4. TOTP: decrypt secret, verify через otplib.
   * 5. Recovery: для каждой неиспользованной recovery-записи user'а — argon2.verify.
   *    При успехе помечаем usedAt = now (race-safe через UPDATE WHERE used_at IS NULL).
   * 6. Если verify пройдёт — cleanup challenge, выпускаем токены через
   *    LoginService.issueTokensForUser (тот же путь что без 2FA).
   *
   * Generic error message — не раскрываем «неверный код» vs «исчерпан лимит» vs
   * «challenge не найден» (anti-enumeration пробного UX).
   */
  async verifyAtLogin(challengeId: string, code: string): Promise<LoginTokenResponse> {
    const consumed = await this.challenge.consumeAttempt(challengeId);
    if (!consumed) {
      throw new UnauthorizedException('Невалидный или истёкший код');
    }

    const { payload, attempt } = consumed;
    this.logger.debug({ challengeId, attempt, userId: payload.userId }, '2fa.verify.attempt');

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        twoFaEnabled: true,
        twoFaSecret: true,
      },
    });
    if (!user || !user.twoFaEnabled || !user.twoFaSecret) {
      // Edge case: между созданием challenge и verify — admin отключил 2FA.
      // Безопасно возвращаем generic error.
      this.logger.warn({ userId: payload.userId }, '2fa.verify.user-not-eligible');
      throw new UnauthorizedException('Невалидный или истёкший код');
    }
    if (user.status !== UserStatus.active) {
      // Между password-step и 2FA verify admin/concierge мог suspend'нуть аккаунт
      // (incident response). Не выпускаем токены — even если код валидный.
      // Generic error — anti-enumeration.
      this.logger.warn(
        { userId: user.id, status: user.status },
        '2fa.verify.blocked-status',
      );
      throw new UnauthorizedException('Невалидный или истёкший код');
    }

    const isTotpFormat = /^\d{6}$/.test(code);
    const verified = isTotpFormat
      ? this.verifyTotp(code, user.twoFaSecret)
      : await this.verifyRecoveryCode(code, user.id);

    if (!verified) {
      throw new UnauthorizedException('Невалидный или истёкший код');
    }

    await this.challenge.cleanup(challengeId);

    this.logger.log(
      { userId: user.id, method: isTotpFormat ? 'totp' : 'recovery' },
      'auth.2fa.verified',
    );

    const ctx = {
      ...(payload.ip !== undefined ? { ip: payload.ip } : {}),
      ...(payload.userAgent !== undefined ? { userAgent: payload.userAgent } : {}),
    };
    return this.login.issueTokensForUser(
      { id: user.id, email: user.email, role: user.role, status: user.status },
      ctx,
    );
  }

  private verifyTotp(code: string, encryptedSecret: string): boolean {
    const secret = this.crypto.decrypt(encryptedSecret);
    const result = verifySync({ secret, token: code });
    return result.valid;
  }

  /**
   * Линейный поиск по неиспользованным recovery codes (≤10 на user'а).
   * Argon2.verify — медленный, но это OK при ≤10 элементах.
   *
   * Race-safety: помечаем used_at в UPDATE WHERE used_at IS NULL — если
   * параллельный verify уже использовал тот же код, наш UPDATE вернёт count=0
   * и мы откатываемся (return false).
   */
  private async verifyRecoveryCode(code: string, userId: string): Promise<boolean> {
    const codes = await this.prisma.recoveryCode.findMany({
      where: { userId, usedAt: null },
      select: { id: true, codeHash: true },
    });

    for (const candidate of codes) {
      const { valid } = await this.password.verify(candidate.codeHash, code);
      if (!valid) continue;

      const claimed = await this.prisma.recoveryCode.updateMany({
        where: { id: candidate.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      return claimed.count > 0;
    }
    return false;
  }

  /**
   * Recovery code: 16 hex-символов (64 бита) с дефис-разделителями.
   * Формат: XXXX-XXXX-XXXX-XXXX. Удобно читать вслух / диктовать.
   */
  private generateRecoveryCode(): string {
    const hex = randomBytes(RECOVERY_CODE_BYTES).toString('hex'); // 16 chars
    return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
  }
}
