'use client';

import { useEffect, useState } from 'react';

import { accessTokenStore } from '../api/client';

import type { AuthUser } from './api';

const REFRESH_TOKEN_KEY = 'ih.refresh';
const USER_KEY = 'ih.user';

/**
 * Lightweight reactive auth store без Zustand/Redux — для текущего объёма
 * хватит useSyncExternalStore-like подход через простой EventTarget.
 *
 * Refresh-токен в localStorage — компромисс фазы 3. В фазе 4 → httpOnly
 * cookie через серверный route handler. См. lib/api/client.ts.
 */

type Listener = () => void;
const listeners = new Set<Listener>();
function notify(): void {
  for (const l of listeners) l();
}

interface PersistedAuth {
  refreshToken: string;
  user: AuthUser;
}

function readPersisted(): PersistedAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const refresh = window.localStorage.getItem(REFRESH_TOKEN_KEY);
    const userRaw = window.localStorage.getItem(USER_KEY);
    if (!refresh || !userRaw) return null;
    return { refreshToken: refresh, user: JSON.parse(userRaw) as AuthUser };
  } catch {
    return null;
  }
}

function writePersisted(data: PersistedAuth | null): void {
  if (typeof window === 'undefined') return;
  if (data) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  }
}

export const authStore = {
  setSession(args: { accessToken: string; refreshToken: string; user: AuthUser }): void {
    accessTokenStore.set(args.accessToken);
    writePersisted({ refreshToken: args.refreshToken, user: args.user });
    notify();
  },

  setAccessToken(token: string): void {
    accessTokenStore.set(token);
    notify();
  },

  setRefreshToken(token: string): void {
    const persisted = readPersisted();
    if (!persisted) return;
    writePersisted({ ...persisted, refreshToken: token });
    notify();
  },

  clear(): void {
    accessTokenStore.clear();
    writePersisted(null);
    notify();
  },

  getRefreshToken(): string | null {
    return readPersisted()?.refreshToken ?? null;
  },

  getUser(): AuthUser | null {
    return readPersisted()?.user ?? null;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/**
 * React hook — current user (reactive).
 * Возвращает null до hydration на клиенте + если не залогинен.
 */
export function useCurrentUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    setUser(authStore.getUser());
    return authStore.subscribe(() => setUser(authStore.getUser()));
  }, []);
  return user;
}
