/**
 * WebPushProvider — production реализация PushProvider через web-push npm (#163).
 *
 * Использует W3C Web Push protocol с VAPID-аутентификацией. Без Firebase /
 * Apple Developer subscription — браузеры (Chrome → FCM, Firefox → Mozilla
 * autopush, Safari iOS PWA → Apple-push) сами роутят через свои инфра-сервисы.
 *
 * VAPID keypair хранится в env (Vault → secrets):
 * - VAPID_PUBLIC_KEY  — отдаётся frontend как NEXT_PUBLIC_VAPID_PUBLIC_KEY
 * - VAPID_PRIVATE_KEY — только backend
 * - VAPID_SUBJECT     — mailto: или https:// owner identifier (требование RFC 8292)
 *
 * Если VAPID_PRIVATE_KEY не задан — Provider не должен инициализироваться
 * (см. comm.module.ts useFactory — переключает на LogPushProvider).
 *
 * 410 Gone / 404 от endpoint'а → expired (subscription больше не валидна).
 * Иные ошибки → failed (best-effort, не throw).
 *
 * Payload: web-push npm сам шифрует AES128GCM через subscription.keys (p256dh+auth).
 * Мы передаём plain JSON {title, body, url, tag} — на устройстве sw.js парсит.
 */
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

import type {
  PushDeliverPayload,
  PushDeliverResult,
  PushProvider,
  PushSubscriptionTarget,
} from './push.provider';

@Injectable()
export class WebPushProvider implements PushProvider, OnModuleInit {
  private readonly logger = new Logger(WebPushProvider.name);
  private configured = false;

  constructor(private readonly config: ConfigService) {}

  /**
   * onModuleInit вызывается на КАЖДОМ старте, даже если useFactory выбрал
   * LogPushProvider. Поэтому не throw'им на отсутствие VAPID — просто
   * не configured. deliver() при попытке доставки отдельно проверит.
   *
   * Это важно для dev-окружения: WebPushProvider регистрируется в DI всегда
   * (нужен для useFactory), но активным становится только если VAPID задан.
   */
  onModuleInit(): void {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT', 'mailto:admin@indiahorizone.ru');

    if (!publicKey || !privateKey) {
      this.logger.debug('web-push.vapid.not-configured (LogPushProvider будет активен)');
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.configured = true;
    this.logger.log(
      { subject, publicKeyPrefix: publicKey.slice(0, 8) },
      'web-push.vapid.configured',
    );
  }

  async deliver(
    target: PushSubscriptionTarget,
    payload: PushDeliverPayload,
  ): Promise<PushDeliverResult> {
    if (!this.configured) {
      // useFactory должен был выбрать LogPushProvider. Если deliver всё-таки
      // дошёл сюда — конфиг error, но не ломаем business-flow.
      return { ok: false, reason: 'WebPushProvider не configured (VAPID_PRIVATE_KEY не задан)' };
    }

    if (target.platform !== 'web') {
      return {
        ok: false,
        reason: `WebPushProvider не поддерживает platform=${target.platform} (нужен ios_native через APNs / android_native через FCM-v1)`,
      };
    }

    if (!target.p256dh || !target.auth) {
      // Без keys нельзя зашифровать payload. Это data-corruption — клиент
      // прислал нам endpoint, но без keys. Логируем и возвращаем failed.
      return { ok: false, reason: 'subscription без p256dh/auth keys' };
    }

    const subscription: webpush.PushSubscription = {
      endpoint: target.endpoint,
      keys: {
        p256dh: target.p256dh,
        auth: target.auth,
      },
    };

    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      ...(payload.url !== undefined ? { url: payload.url } : {}),
      ...(payload.tag !== undefined ? { tag: payload.tag } : {}),
    });

    try {
      // TTL: high-urgency = 1h (контекст SOS быстро устаревает), normal = 24h
      const urgency = payload.urgency ?? 'normal';
      const ttl = urgency === 'high' ? 60 * 60 : 24 * 60 * 60;

      await webpush.sendNotification(subscription, body, {
        TTL: ttl,
        urgency,
      });
      return { ok: true };
    } catch (err) {
      // web-push кидает WebPushError с statusCode. 410 Gone и 404 — expired.
      const statusCode =
        err && typeof err === 'object' && 'statusCode' in err
          ? (err as { statusCode: number }).statusCode
          : undefined;

      if (statusCode === 410 || statusCode === 404) {
        return { ok: false, expired: true, reason: `endpoint ${statusCode} (gone)` };
      }

      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        { subscriptionId: target.id, statusCode, message },
        'web-push.deliver.failed',
      );
      return { ok: false, reason: `${statusCode ?? 'unknown'}: ${message}` };
    }
  }
}
