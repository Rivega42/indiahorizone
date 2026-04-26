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
};
