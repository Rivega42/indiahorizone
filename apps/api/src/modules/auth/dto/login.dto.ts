import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(254)
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Пароль обязателен' })
  @MaxLength(128)
  password!: string;
}

export interface LoginTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Если у user активирован 2FA — login возвращает challengeId вместо токенов.
 * Клиент должен вызвать POST /auth/2fa/verify { challengeId, code } для
 * получения токенов. Challenge живёт 5 минут, ≤5 попыток.
 */
export interface LoginChallengeResponse {
  challengeId: string;
}

/**
 * Discriminated union: проверять наличие `challengeId` для определения формы.
 */
export type LoginResponse = LoginTokenResponse | LoginChallengeResponse;
