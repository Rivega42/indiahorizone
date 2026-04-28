/**
 * Throttler профили (#221).
 *
 * Используются через @Throttle({...}) на конкретных endpoint'ах ИЛИ как
 * default через ThrottlerModule.forRootAsync.
 *
 * Стратегия:
 * - global default = `api` (100/min/user) — для всех authenticated endpoint'ов
 * - `auth` (10/min/IP) — на /auth/login, /auth/register, /auth/refresh и проч.
 *   IP-based (не user-based), потому что атакующий может пробовать с одного IP
 *   разные email'ы — лимит по IP жёстче чем по user.
 * - `media-upload` (20/min/user) — для будущего media-svc presigned-URL endpoint'а
 * - `sos` (no limit) — критично, SOS не должен быть rate-limited никогда.
 *
 * TTL в миллисекундах (NestJS throttler v6 формат).
 */
import { seconds } from '@nestjs/throttler';

import type { ThrottlerOptions } from '@nestjs/throttler';

/** Имена профилей — должны совпадать с keys в forRoot([...]) */
export const THROTTLE_PROFILE = {
  api: 'api',
  auth: 'auth',
  mediaUpload: 'media-upload',
  sos: 'sos',
} as const;

export const THROTTLE_PROFILES: ThrottlerOptions[] = [
  {
    name: THROTTLE_PROFILE.api,
    ttl: seconds(60),
    limit: 100,
  },
  {
    name: THROTTLE_PROFILE.auth,
    ttl: seconds(60),
    limit: 10,
  },
  {
    name: THROTTLE_PROFILE.mediaUpload,
    ttl: seconds(60),
    limit: 20,
  },
  {
    // SOS — большой limit (effectively unlimited для пользователя в кризисе),
    // но не Infinity чтобы исключить bug-loops случайного DDoS на самих себя.
    name: THROTTLE_PROFILE.sos,
    ttl: seconds(60),
    limit: 1000,
  },
];
