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
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { generateSecret, generateURI, verifySync } from 'otplib';

import { PasswordService } from '../services/password.service';
import { CryptoService } from '../../../common/crypto/crypto.service';
import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

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
   * Recovery code: 16 hex-символов (64 бита) с дефис-разделителями.
   * Формат: XXXX-XXXX-XXXX-XXXX. Удобно читать вслух / диктовать.
   */
  private generateRecoveryCode(): string {
    const hex = randomBytes(RECOVERY_CODE_BYTES).toString('hex'); // 16 chars
    return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
  }
}
