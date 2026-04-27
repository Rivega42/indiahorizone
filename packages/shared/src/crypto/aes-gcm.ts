/**
 * AES-256-GCM column-level encryption.
 *
 * Назначение: шифровать поля ПДн (firstName, lastName, dateOfBirth, phone)
 * перед записью в БД, расшифровывать при чтении. Защищает от leak'а dump'а БД.
 *
 * Формат на диске: base64( iv (12 байт) || ciphertext || authTag (16 байт) ).
 * GCM = authenticated encryption — modification detect'ится при decrypt
 * (ошибка → throw).
 *
 * Master-key — 32 байта (256 бит). В env передаётся как base64 (44 символа).
 * Сгенерировать: `openssl rand -base64 32`.
 *
 * Этот модуль — runtime-agnostic: использует `node:crypto` напрямую, без
 * зависимостей от NestJS / Prisma. Может быть импортирован из api / web.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const KEY_BYTES = 32; // AES-256
const IV_BYTES = 12; // GCM рекомендация
const TAG_BYTES = 16;

export class CryptoError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'CryptoError';
  }
}

/**
 * Загрузить master-key из base64-строки.
 * Throws CryptoError если длина не 32 байта.
 */
export function keyFromBase64(base64: string): Buffer {
  const buf = Buffer.from(base64, 'base64');
  if (buf.length !== KEY_BYTES) {
    throw new CryptoError(
      `Invalid encryption key length: ${buf.length} bytes (expected ${KEY_BYTES})`,
    );
  }
  return buf;
}

/**
 * Сгенерировать 32-байтовый ключ. Только для тестов / dev-bootstrap.
 */
export function generateKey(): Buffer {
  return randomBytes(KEY_BYTES);
}

/**
 * Шифрует plaintext (string) → base64-строка.
 *
 * Каждый вызов генерит свежий IV — одно и то же значение даёт разный
 * ciphertext (semantic security). Не используется для search/index'а.
 */
export function encrypt(plaintext: string, key: Buffer): string {
  if (key.length !== KEY_BYTES) {
    throw new CryptoError('Invalid key length');
  }
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString('base64');
}

/**
 * Расшифровывает base64-строку → plaintext.
 *
 * Throws CryptoError при:
 * - неверном формате (длина < IV+TAG)
 * - неверном ключе (auth tag mismatch — данные изменены или ключ другой)
 */
export function decrypt(payload: string, key: Buffer): string {
  if (key.length !== KEY_BYTES) {
    throw new CryptoError('Invalid key length');
  }
  let buf: Buffer;
  try {
    buf = Buffer.from(payload, 'base64');
  } catch (err) {
    throw new CryptoError('Invalid base64 payload', { cause: err });
  }
  if (buf.length < IV_BYTES + TAG_BYTES) {
    throw new CryptoError('Payload too short');
  }
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(buf.length - TAG_BYTES);
  const ciphertext = buf.subarray(IV_BYTES, buf.length - TAG_BYTES);
  try {
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    throw new CryptoError('Decryption failed (auth tag mismatch or wrong key)', {
      cause: err,
    });
  }
}

/**
 * Heuristic: похоже ли значение на наш encrypted-payload?
 *
 * Используется в Prisma extension как защита от двойного шифрования
 * при повторном write одной и той же сущности (race condition).
 *
 * НЕ криптографическая проверка — просто формат-чек: длина + base64.
 */
export function looksEncrypted(value: string): boolean {
  // Минимальная длина для пустого plaintext + iv + tag = 12 + 0 + 16 = 28 байт = 40 base64 chars
  if (value.length < 40) return false;
  // Должно быть валидным base64
  if (!/^[A-Za-z0-9+/]+=*$/.test(value)) return false;
  try {
    const buf = Buffer.from(value, 'base64');
    return buf.length >= IV_BYTES + TAG_BYTES;
  } catch {
    return false;
  }
}
