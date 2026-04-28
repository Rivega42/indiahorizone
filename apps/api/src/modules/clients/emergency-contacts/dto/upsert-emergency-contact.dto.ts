import { EmergencyContactPriority } from '@prisma/client';
import { IsEnum, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * DTO для POST/PATCH /clients/me/emergency-contacts (#144).
 *
 * - name: ФИО (2-100 chars)
 * - phone: E.164 (+ и 10–15 цифр)
 * - relation: «Отец», «Жена» — свободный текст
 * - language: ISO 639-1 (ru/en/...)
 * - priority: primary | secondary (один на каждый — uniqueness в БД)
 */
export class UpsertEmergencyContactDto {
  @IsString()
  @MinLength(2, { message: 'name минимум 2 символа' })
  @MaxLength(100)
  name!: string;

  @IsString()
  @Matches(/^\+\d{10,15}$/, { message: 'phone в формате E.164: +<country><number>' })
  phone!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  relation!: string;

  @IsString()
  @Length(2, 2, { message: 'language — ISO 639-1 (2 символа), например "ru" или "en"' })
  @Matches(/^[a-z]{2}$/, { message: 'language — нижний регистр' })
  language!: string;

  @IsEnum(EmergencyContactPriority, {
    message: 'priority — primary или secondary',
  })
  priority!: EmergencyContactPriority;
}
