import { crypto as sharedCrypto } from '@indiahorizone/shared';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * CryptoService — DI-обёртка над shared/crypto для NestJS.
 *
 * Загружает master-key из env `ENCRYPTION_MASTER_KEY` (base64, 32 байта).
 * При отсутствии в production — fail-fast (throws при init).
 * В development — генерирует ephemeral key + предупреждение.
 *
 * В фазе 4 — ключ из Vault / KMS через #220 (replace this service in DI).
 */
@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly masterKey: Buffer;

  constructor(config: ConfigService) {
    const envKey = config.get<string>('ENCRYPTION_MASTER_KEY');
    const isProd = config.get<string>('NODE_ENV') === 'production';

    if (envKey) {
      try {
        this.masterKey = sharedCrypto.keyFromBase64(envKey);
        this.logger.log('Encryption master-key loaded from env');
      } catch (err) {
        throw new Error(
          `ENCRYPTION_MASTER_KEY invalid (expected base64 of 32 bytes): ${(err as Error).message}`,
        );
      }
    } else if (isProd) {
      throw new Error('ENCRYPTION_MASTER_KEY is required in production');
    } else {
      this.masterKey = sharedCrypto.generateKey();
      this.logger.warn(
        'ENCRYPTION_MASTER_KEY not set — using ephemeral key (dev only). ' +
          'Data encrypted now will be UNREADABLE after restart.',
      );
    }
  }

  /**
   * Шифрует строку или возвращает её as-is, если уже зашифрована
   * (защита от race-condition'а с повторным write).
   */
  encrypt(plaintext: string): string {
    if (sharedCrypto.looksEncrypted(plaintext)) {
      // Уже выглядит как ciphertext — повторный encrypt сделает unreadable.
      // Возможно при повторном update'е без read-decrypt-modify.
      this.logger.warn('encrypt called on already-encrypted-looking value, skipping');
      return plaintext;
    }
    return sharedCrypto.encrypt(plaintext, this.masterKey);
  }

  /**
   * Расшифровывает base64-payload в plaintext.
   * Throws CryptoError при неверном ключе / повреждённых данных.
   */
  decrypt(payload: string): string {
    return sharedCrypto.decrypt(payload, this.masterKey);
  }

  /**
   * Try-decrypt: возвращает null если расшифровать не удалось.
   * Используется в read-path Prisma extension — на случай,
   * если в БД попало сырое значение из-за миграции/баги.
   */
  tryDecrypt(payload: string): string | null {
    try {
      return sharedCrypto.decrypt(payload, this.masterKey);
    } catch {
      return null;
    }
  }
}
