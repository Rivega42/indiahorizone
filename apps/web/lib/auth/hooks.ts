'use client';

import { useMutation } from '@tanstack/react-query';

import {
  authApi,
  isLoginChallenge,
  type LoginPayload,
  type LoginResult,
  type RegisterPayload,
  type RegisterResponse,
} from './api';
import { authStore } from './store';

/**
 * useLogin — мутация POST /auth/login.
 *
 * onSuccess: если ответ — challenge (2FA активирован у пользователя),
 * НЕ пишет токены (их нет). Caller получает `result.challengeId` через
 * mutation.data и редиректит на /login/2fa.
 *
 * Если ответ — обычный LoginResponse с токенами, пишет в authStore.
 */
export function useLogin(): ReturnType<typeof useMutation<LoginResult, unknown, LoginPayload>> {
  return useMutation<LoginResult, unknown, LoginPayload>({
    mutationFn: (payload) => authApi.login(payload),
    onSuccess: (data) => {
      if (isLoginChallenge(data)) {
        // 2FA challenge — токенов ещё нет, caller-страница покажет /login/2fa.
        return;
      }
      authStore.setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
    },
  });
}

/**
 * useRegister — мутация POST /auth/register.
 * Не пишет токены (login отдельно после регистрации).
 */
export function useRegister(): ReturnType<
  typeof useMutation<RegisterResponse, unknown, RegisterPayload>
> {
  return useMutation<RegisterResponse, unknown, RegisterPayload>({
    mutationFn: (payload) => authApi.register(payload),
  });
}

/**
 * useLogout — мутация POST /auth/logout.
 * onSuccess (или onError): чистит authStore.
 */
export function useLogout(): ReturnType<typeof useMutation<void, unknown, void>> {
  return useMutation<void, unknown, void>({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      // Чистим токены даже при ошибке — клиент должен забыть session
      authStore.clear();
    },
  });
}
