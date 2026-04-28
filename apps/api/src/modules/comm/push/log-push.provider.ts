/**
 * LogPushProvider — dev / pre-credential stub для PushProvider (#163).
 *
 * Логирует, что бы было отправлено. НЕ доставляет реальные push'и. Используется
 * до получения VAPID keys (#353 Firebase) — позволяет видеть в логах поток
 * notification'ов и отлаживать сервис.
 *
 * Для production switch'аемся на WebPushProvider (TODO когда VAPID будет):
 *
 *   imports: [...] // ConfigModule
 *   providers: [
 *     {
 *       provide: PUSH_PROVIDER,
 *       inject: [ConfigService],
 *       useFactory: (cfg: ConfigService) => {
 *         const vapidPriv = cfg.get('VAPID_PRIVATE_KEY');
 *         return vapidPriv ? new WebPushProvider(cfg) : new LogPushProvider();
 *       },
 *     },
 *   ]
 */
import { Injectable, Logger } from '@nestjs/common';

import type {
  PushDeliverPayload,
  PushDeliverResult,
  PushProvider,
  PushSubscriptionTarget,
} from './push.provider';

@Injectable()
export class LogPushProvider implements PushProvider {
  private readonly logger = new Logger(LogPushProvider.name);

  deliver(target: PushSubscriptionTarget, payload: PushDeliverPayload): Promise<PushDeliverResult> {
    this.logger.log(
      {
        target: {
          id: target.id,
          platform: target.platform,
          endpoint: this.maskEndpoint(target.endpoint),
        },
        payload: { title: payload.title, body: payload.body, url: payload.url, tag: payload.tag },
      },
      'push.deliver.simulated',
    );
    return Promise.resolve({ ok: true, reason: 'simulated' });
  }

  /** Не публикуем endpoint целиком в логи — он уникален per-device, потенциально PII. */
  private maskEndpoint(endpoint: string): string {
    if (endpoint.length <= 40) return endpoint;
    return `${endpoint.slice(0, 30)}…${endpoint.slice(-10)}`;
  }
}
