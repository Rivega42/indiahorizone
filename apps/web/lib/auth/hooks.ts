'use client';

import { useMutation } from '@tanstack/react-query';

import {
  authApi,
  type LoginPayload,
  type LoginResponse,
  type RegisterPayload,
  type RegisterResponse,
} from './api';
import { authStore } from './store';

/**
 * useLogin — мутация POST /auth/login.
 * onSuccess: пишет токены и user в authStore. После — caller роутит на /trips.
 */
export function useLogin(): ReturnType<typeof useMutation<LoginResponse, unknown, LoginPayload>> {
  return useMutation<LoginResponse, unknown, LoginPayload>({
    mutationFn: (payload) => authApi.login(payload),
    onSuccess: (data) => {
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
