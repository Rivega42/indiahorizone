import { IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * DTO для POST /auth/2fa/verify — finalize login после challenge'а (#133).
 *
 * code может быть:
 * - 6 цифр — TOTP из authenticator-приложения
 * - XXXX-XXXX-XXXX-XXXX — recovery code (одноразовый)
 *
 * Server-side определяет формат по regex и проверяет соответственно.
 */
export class VerifyTwoFaLoginDto {
  @IsUUID(4, { message: 'challengeId должен быть UUIDv4' })
  challengeId!: string;

  @IsString()
  @MaxLength(32, { message: 'code слишком длинный' })
  code!: string;
}
