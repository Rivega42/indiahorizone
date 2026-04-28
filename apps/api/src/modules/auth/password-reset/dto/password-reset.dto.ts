import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/**
 * POST /auth/password/reset-request — { email }.
 * Anti-enumeration: всегда 204 (даже если email не существует).
 */
export class RequestPasswordResetDto {
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(254)
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  email!: string;
}

/**
 * POST /auth/password/reset — { token, newPassword }.
 * - token: UUIDv4 из email-ссылки
 * - newPassword: ≥12 символов; полная zxcvbn-проверка в сервисе.
 */
export class ConfirmPasswordResetDto {
  @IsUUID(4, { message: 'Невалидный токен' })
  token!: string;

  @IsString()
  @MinLength(12, { message: 'Пароль должен быть не менее 12 символов' })
  @MaxLength(128, { message: 'Пароль слишком длинный' })
  newPassword!: string;
}
