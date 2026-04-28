import { IsString, Length, Matches } from 'class-validator';

/**
 * DTO для POST /auth/2fa/verify-enroll.
 *
 * Юзер вводит 6-значный TOTP код из authenticator-приложения.
 * При успехе — 2FA активирован, возвращаются 10 recovery codes (один раз).
 *
 * Issue: #132 [M5.B.7]
 */
export class VerifyEnrollDto {
  @IsString()
  @Length(6, 6, { message: 'TOTP код должен быть 6 цифр' })
  @Matches(/^\d{6}$/, { message: 'TOTP код — только цифры' })
  code!: string;
}

export interface EnrollResponse {
  /**
   * Plaintext base32-секрет. Используется UI для ручного ввода в authenticator,
   * если QR-сканирование недоступно. После refresh страницы — недоступен,
   * пользователь должен запустить enroll заново.
   */
  secret: string;
  /**
   * otpauth://totp/IndiaHorizone:{email}?secret={secret}&issuer=IndiaHorizone
   * Клиент рендерит QR-код из этой URL.
   */
  otpAuthUrl: string;
}

export interface VerifyEnrollResponse {
  /**
   * 10 recovery-кодов в plaintext. Возвращаются ОДИН раз — после ответа
   * сервер хранит только argon2id-хеши, восстановить нельзя.
   * Формат: XXXX-XXXX-XXXX-XXXX (16 hex-символов с разделителями).
   */
  recoveryCodes: string[];
}
