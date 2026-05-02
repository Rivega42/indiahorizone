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

/**
 * SDK-клиенты для auth-svc.
 * Соответствуют контракту backend (apps/api/src/modules/auth/auth.controller.ts).
 */
export const authApi = {
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const { data } = await apiClient.post<RegisterResponse>('/auth/register', payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
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
};
