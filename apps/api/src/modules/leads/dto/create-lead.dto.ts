import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

/**
 * DTO для POST /leads. Все поля строгие.
 * `consent === true` обязателен — на сервере проверяем явно (152-ФЗ).
 *
 * Шифрование name/contact/comment происходит в LeadsService через
 * CryptoService (#139).
 */
export class CreateLeadDto {
  /** 'tour-<slug>' | 'general' */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  source!: string;

  @IsString()
  @Length(2, 100)
  name!: string;

  @IsIn(['phone', 'telegram', 'email'])
  contactType!: 'phone' | 'telegram' | 'email';

  /** Сырой контакт. Валидация формата — в service (по contactType). */
  @IsString()
  @Length(3, 200)
  contact!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  /**
   * Обязательно `true`. На сервере дополнительный check — на случай обхода
   * фронт-валидации (защита от Роскомнадзора 152-ФЗ).
   */
  @IsBoolean()
  consent!: boolean;

  /** Версия текста consent на момент отправки. Формат: 'YYYY-MM-DD-vN'. */
  @IsString()
  @MaxLength(20)
  consentTextVersion!: string;
}
