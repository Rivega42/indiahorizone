/**
 * Шифрование/расшифровка ПДн полей в ClientProfile.
 *
 * Используется в ClientsService при write/read операциях. Изоляция логики
 * encryption в этом модуле — чтобы избежать дублирования и забывания
 * encrypt/decrypt в каждом caller'е.
 *
 * Зашифрованные поля: firstName, lastName, dateOfBirth, phone.
 *
 * НЕ зашифрованы:
 * - citizenship — ISO-код страны, не персонифицирующий сам по себе
 * - telegramHandle — публичный username, не ПДн в смысле 152-ФЗ
 * - preferences — JSONB; если в нём появятся ПДн (диета как медданные), —
 *   отдельно encrypt'нем поле в JSON (в #142 consent-profile).
 *
 * Соответствует docs/LEGAL/PDN.md и acceptance #139.
 */
import type { CryptoService } from '../../../common/crypto/crypto.service';
import type { ClientProfile, Prisma } from '@prisma/client';


const ENCRYPTED_FIELDS: readonly (keyof ClientProfile)[] = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'phone',
] as const;

export type EncryptableProfileInput = Partial<{
  firstName: string | null;
  lastName: string | null;
  /**
   * ISO date-string YYYY-MM-DD. Контроллер обязан конвертировать Date → string
   * на уровне DTO (см. #140). На рантайме допускается также Date — ниже мы
   * приведём к ISO, но тип строго string чтобы Prisma.update принимал результат
   * без cast'ов.
   */
  dateOfBirth: string | null;
  phone: string | null;
}>;

/**
 * Тип результата encryptProfile: ENCRYPTED_FIELDS превращаются в base64-string,
 * остальные поля (citizenship/clientId/etc.) сохраняются как были.
 */
type EncryptedProfile<T> = {
  [K in keyof T]: K extends 'firstName' | 'lastName' | 'dateOfBirth' | 'phone'
    ? string | (T[K] extends null | undefined ? Extract<T[K], null | undefined> : never)
    : T[K];
};

/**
 * Шифрует ПДн поля в data-объекте перед записью в БД.
 *
 * Mutates copy (не оригинал). Поля null/undefined пропускает.
 * Возвращает объект совместимый с Prisma.ClientProfileUncheckedCreateInput.
 */
export function encryptProfile<T extends EncryptableProfileInput>(
  data: T,
  crypto: CryptoService,
): EncryptedProfile<T> {
  const out: Record<string, unknown> = { ...data };

  for (const field of ENCRYPTED_FIELDS) {
    const raw = out[field];
    if (raw == null) continue; // null или undefined — оставляем

    // Defensive: на рантайме принимаем Date (если кто-то забыл конвертнуть в DTO).
    // Иначе — type-level гарантия что raw: string (см. EncryptableProfileInput).
    let asString: string;
    if (raw instanceof Date) {
      asString = raw.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    } else if (typeof raw === 'string') {
      asString = raw;
    } else {
      // Не должно случиться — тип запрещает; выбрасываем чтобы сразу заметить регрессию.
      throw new TypeError(`encryptProfile: field ${field} has unexpected type ${typeof raw}`);
    }
    out[field] = crypto.encrypt(asString);
  }

  return out as EncryptedProfile<T>;
}

/**
 * Расшифровывает ПДн поля в результате query.
 *
 * Mutates input. Поля, которые не удалось расшифровать (другой ключ,
 * повреждение) — оставляются как есть с warning'ом в CryptoService —
 * caller увидит base64. Это лучше, чем 500 ошибка на read.
 *
 * Возвращает обратно тот же объект для удобства chaining.
 */
export function decryptProfile<T extends ClientProfile | null | undefined>(
  profile: T,
  crypto: CryptoService,
): T {
  if (!profile) return profile;

  for (const field of ENCRYPTED_FIELDS) {
    const value = profile[field];
    if (typeof value !== 'string') continue;
    const decrypted = crypto.tryDecrypt(value);
    if (decrypted !== null) {
      // assertion безопасен — мы проверили что value: string и расшифровали в string
      (profile as unknown as Record<string, unknown>)[field] = decrypted;
    }
  }

  return profile;
}

/**
 * Расшифровывает массив профилей (для findMany / include в Client.findMany).
 */
export function decryptProfiles<T extends ClientProfile>(
  profiles: T[],
  crypto: CryptoService,
): T[] {
  for (const p of profiles) {
    decryptProfile(p, crypto);
  }
  return profiles;
}

/**
 * Helper для Client с include: { profile: true } — расшифровывает вложенный profile.
 */
export function decryptClientWithProfile<
  T extends { profile: ClientProfile | null } | null,
>(client: T, crypto: CryptoService): T {
  if (client && client.profile) {
    decryptProfile(client.profile, crypto);
  }
  return client;
}

/**
 * Возвращает безопасную для логирования копию профиля — ПДн поля заменены
 * на маркер `[redacted]`. Используется в ClientsService.logger.log({...}).
 *
 * Полный pino redact-конфиг (для всех логов автоматически) появится в
 * #124 (Pino logger + correlation-id middleware). До этого — явная
 * утилита для дисциплины.
 */
export function redactProfileForLog<T extends Partial<ClientProfile>>(profile: T): T {
  const safe: Record<string, unknown> = { ...profile };
  for (const field of ENCRYPTED_FIELDS) {
    if (safe[field] != null) {
      safe[field] = '[redacted]';
    }
  }
  return safe as T;
}

export { ENCRYPTED_FIELDS };
export type { Prisma };
