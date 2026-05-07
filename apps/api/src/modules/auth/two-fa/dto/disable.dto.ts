import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO для POST /auth/2fa/disable.
 *
 * Юзер вводит TOTP-код (6 цифр) ИЛИ recovery-код (16 hex с разделителями).
 * Сервис сам определяет формат по regex.
 *
 * Issue: #438 (sub-issue A-03).
 */
export class DisableTwoFaDto {
  @IsString()
  @MinLength(6, { message: 'Код слишком короткий' })
  @MaxLength(40, { message: 'Код слишком длинный' })
  code!: string;
}
