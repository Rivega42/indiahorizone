import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL =
  typeof process !== 'undefined' && process.env['NEXT_PUBLIC_API_URL']
    ? process.env['NEXT_PUBLIC_API_URL']
    : 'http://localhost:4000';

/**
 * Генерирует UUID v4. Используется для X-Correlation-Id.
 * crypto.randomUUID() доступен в современных браузерах (90%+ users по statcounter)
 * и в Node 19+. Fallback не делаем — если браузер не поддерживает, лучше
 * чтобы клиент обновился.
 */
function newCorrelationId(): string {
  return globalThis.crypto.randomUUID();
}

/**
 * Хранилище access-токена. Не сохраняем в localStorage — XSS-уязвимо.
 * Refresh-токен хранится в httpOnly cookie (set серверной частью), access —
 * в memory. При reload страницы — refresh через POST /auth/refresh.
 *
 * В фазе 4 — переход на полностью cookie-based (samesite=strict + httpOnly).
 * Сейчас memory-only access + cookie refresh — компромисс между UX и security.
 */
class AccessTokenStore {
  private token: string | null = null;

  set(token: string): void {
    this.token = token;
  }

  get(): string | null {
    return this.token;
  }

  clear(): void {
    this.token = null;
  }
}

export const accessTokenStore = new AccessTokenStore();

/**
 * Создаёт настроенный axios-инстанс.
 *
 * Фичи:
 * - baseURL из NEXT_PUBLIC_API_URL (default localhost:4000)
 * - X-Correlation-Id на каждый запрос (UUID v4) — для трейсинга backend↔frontend
 * - Authorization: Bearer <accessToken> auto-attach из accessTokenStore
 * - 30-сек timeout
 * - Идемпотентные ретраи в #221 (не сейчас)
 *
 * Refresh-flow: при 401 — пробуем POST /auth/refresh (через httpOnly cookie),
 * получаем новый access, повторяем оригинальный запрос. Реализуется
 * отдельно в auth-hooks (#135), чтобы не привязывать infra-слой к auth-логике.
 */
function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30_000,
    withCredentials: true, // для refresh-cookie в фазе 4
  });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.headers.set('X-Correlation-Id', newCorrelationId());

    const token = accessTokenStore.get();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Логируем correlation-id из request на серверные ошибки — для дебага
      if (error.response && error.response.status >= 500) {
        const corrId = error.config?.headers?.['X-Correlation-Id'];
        // eslint-disable-next-line no-console
        console.error('[api]', error.response.status, corrId, error.config?.url);
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

export const apiClient = createApiClient();

/**
 * Тип ответа об ошибке от NestJS ValidationPipe.
 * Используется в catch-блоках для извлечения user-friendly сообщения.
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  // Для register: zxcvbn-warnings
  warning?: string;
  suggestions?: string[];
}

export function isApiError(err: unknown): err is AxiosError<ApiErrorResponse> {
  return axios.isAxiosError(err);
}

/**
 * Извлекает user-friendly сообщение из API-ошибки.
 * Поддерживает массив messages (validation) и одиночный (бизнес).
 */
export function getErrorMessage(err: unknown, fallback = 'Что-то пошло не так'): string {
  if (!isApiError(err)) return fallback;
  const data = err.response?.data;
  if (!data) return fallback;
  if (Array.isArray(data.message)) return data.message[0] ?? fallback;
  return data.message ?? fallback;
}
