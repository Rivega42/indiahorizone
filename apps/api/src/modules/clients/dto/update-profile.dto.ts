import { Transform } from 'class-transformer';
import {
  IsISO31661Alpha2,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/**
 * DTO для PATCH /clients/me.
 *
 * Patch-семантика:
 * - omitted поле = нет изменений
 * - явный null = очистить значение (для nullable полей)
 *
 * Шифрование ПДн (firstName, lastName, dateOfBirth, phone) делает
 * ClientsService.updateProfile через encryptProfile().
 *
 * Issue: #140 [M5.C.3]
 */
export class UpdateClientProfileDto {
  @IsOptional()
  @ValidateIf((_obj, value: unknown) => value !== null)
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string | null;

  @IsOptional()
  @ValidateIf((_obj, value: unknown) => value !== null)
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string | null;

  /**
   * ISO date YYYY-MM-DD. Контроллер проверяет формат через @Matches.
   * Шифрование как plaintext-string (не Date) — простота indexing'а
   * и совместимость с EncryptableProfileInput.
   */
  @IsOptional()
  @ValidateIf((_obj, value: unknown) => value !== null)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateOfBirth должен быть в формате YYYY-MM-DD' })
  dateOfBirth?: string | null;

  /**
   * ISO 3166-1 alpha-2 (например "RU", "IN"). Не шифруется.
   */
  @IsOptional()
  @ValidateIf((_obj, value: unknown) => value !== null)
  @IsISO31661Alpha2({ message: 'citizenship должен быть ISO 3166-1 alpha-2 (например RU)' })
  citizenship?: string | null;

  /**
   * E.164: + и 10–15 цифр. Хранится зашифрованным.
   */
  @IsOptional()
  @ValidateIf((_obj, value: unknown) => value !== null)
  @IsString()
  @Matches(/^\+\d{10,15}$/, { message: 'phone должен быть в формате E.164: +<country><number>' })
  phone?: string | null;

  /**
   * Telegram username без @. Не шифруется (публичный handle).
   * Лимит 32 — по правилам Telegram.
   */
  @IsOptional()
  @ValidateIf((_obj, value: unknown) => value !== null)
  @IsString()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9_]{5,32}$/, {
    message: 'telegramHandle: 5–32 символа, латиница/цифры/подчёркивание, без @',
  })
  telegramHandle?: string | null;

  /**
   * JSONB-объект: языки, диеты, специальные требования.
   * Пример: { "languages": ["ru", "en"], "diet": "vegetarian" }.
   *
   * Глубокую валидацию структуры не делаем — это V1 «свободный JSON».
   * Когда появятся бизнес-фичи завязанные на конкретные ключи (например
   * filter по `diet`) — добавим конкретные DTO-поля.
   */
  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}
