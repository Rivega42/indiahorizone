import { apiClient } from '../api/client';

export type UserRole = 'client' | 'guide' | 'manager' | 'concierge' | 'finance' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role?: UserRole;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SessionItem {
  id: string;
  deviceLabel: string;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

export interface TwoFaEnrollResponse {
  /** Plaintext base32-секрет для ручного ввода (если QR недоступен). */
  secret: string;
  /** otpauth:// URL для рендера QR. */
  otpAuthUrl: string;
}

export interface TwoFaVerifyEnrollResponse {
  /** 10 recovery-кодов в формате XXXX-XXXX-XXXX-XXXX. Возвращаются ОДИН раз. */
  recoveryCodes: string[];
}

/**
 * Login response — discriminated union (#A-03/A-04):
 * - LoginTokenResponse: пользователь без 2FA, выпущены токены сразу.
 * - LoginChallengeResponse: пользователь с активированным 2FA, нужно вызвать
 *   POST /auth/2fa/verify { challengeId, code } для получения токенов.
 */
export interface LoginChallengeResponse {
  challengeId: string;
}

export type LoginResult = LoginResponse | LoginChallengeResponse;

export function isLoginChallenge(result: LoginResult): result is LoginChallengeResponse {
  return 'challengeId' in result;
}

/**
 * SDK-клиенты для auth-svc.
 * Соответствуют контракту backend (apps/api/src/modules/auth/auth.controller.ts).
 */
export const authApi = {
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const { data } = await apiClient.post<RegisterResponse>('/auth/register', payload);
    return data;
  },

  /**
   * POST /auth/login.
   *
   * Возвращает либо токены (LoginResponse), либо challenge (LoginChallengeResponse)
   * если у пользователя активирован 2FA. Используйте `isLoginChallenge(result)`
   * для type narrowing.
   */
  async login(payload: LoginPayload): Promise<LoginResult> {
    const { data } = await apiClient.post<LoginResult>('/auth/login', payload);
    return data;
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const { data } = await apiClient.post<RefreshResponse>('/auth/refresh', { refreshToken });
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async logoutAll(): Promise<{ revokedCount: number }> {
    const { data } = await apiClient.post<{ revokedCount: number }>('/auth/logout-all');
    return data;
  },

  /**
   * Запрос ссылки сброса пароля (#A-12).
   *
   * Anti-enumeration: всегда 204, независимо от существования email.
   * При запросе несуществующего email — никакое сообщение не отправляется.
   */
  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/password/reset-request', { email });
  },

  /**
   * Подтверждение нового пароля по токену из email (#A-12).
   *
   * 204 при успехе. 401 при невалидном/истёкшем токене (1h TTL).
   * 400 при слабом пароле (zxcvbn-проверка на бэке).
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/password/reset', { token, newPassword });
  },

  /**
   * Список активных сессий (#A-05).
   *
   * Возвращает все сессии с revokedAt=null и expiresAt > now,
   * с пометкой `current: true` для текущей сессии (по sessionId из JWT).
   */
  async listSessions(): Promise<SessionItem[]> {
    const { data } = await apiClient.get<{ items: SessionItem[] }>('/auth/sessions');
    return data.items;
  },

  /**
   * Завершить конкретную сессию (#A-05).
   *
   * 204 при успехе. 403 если пытаются завершить текущую (для этого
   * есть POST /auth/logout). 404 если сессия не найдена / не принадлежит
   * пользователю / уже revoked.
   */
  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  /**
   * Шаг 1 enrollment 2FA (#A-03): получить TOTP-secret + otpauth-URL для QR.
   *
   * 200 OK с { secret, otpAuthUrl }. Secret шифруется и сохраняется на user'е,
   * но twoFaEnabled пока остаётся false до verify-enroll. Повторный вызов
   * генерирует новый secret (старый перезаписывается).
   *
   * 409 если 2FA уже активирован.
   */
  async enroll2fa(): Promise<TwoFaEnrollResponse> {
    const { data } = await apiClient.post<TwoFaEnrollResponse>('/auth/2fa/enroll');
    return data;
  },

  /**
   * Шаг 2 enrollment 2FA (#A-03): подтвердить TOTP-код, активировать 2FA,
   * получить 10 recovery-кодов (один раз — потом не восстановить).
   *
   * 200 OK с { recoveryCodes }. 401 при неверном TOTP. 409 если уже активирован.
   */
  async verify2faEnroll(code: string): Promise<TwoFaVerifyEnrollResponse> {
    const { data } = await apiClient.post<TwoFaVerifyEnrollResponse>('/auth/2fa/verify-enroll', {
      code,
    });
    return data;
  },

  /**
   * Отключить 2FA (#A-03 / #438). Требует TOTP-код или recovery-код для
   * подтверждения владения вторым фактором.
   *
   * 204 при успехе. 401 при неверном коде. 400 если 2FA не активирован.
   */
  async disable2fa(code: string): Promise<void> {
    await apiClient.post('/auth/2fa/disable', { code });
  },

  /**
   * 2FA verify при login (#A-04). Public endpoint — identity proven by
   * challengeId, выданным после успешного password-step.
   *
   * 200 OK с access/refresh токенами при успехе.
   * 401 при неверном/истёкшем коде ИЛИ исчерпании 5 попыток.
   */
  async verify2faLogin(challengeId: string, code: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/2fa/verify', {
      challengeId,
      code,
    });
    return data;
  },
};
