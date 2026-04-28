/**
 * SuspiciousLoginDetector — эвристика обнаружения подозрительных входов (#136).
 *
 * После успешного login сравниваем context (ip + userAgent) с предыдущей
 * активной Session'ой того же user'а. Если:
 * - IP /16 префикс отличается → новая сеть (другая страна / провайдер)
 * - User-Agent сильно отличается (другой platform / browser)
 *
 * → публикуем event `auth.session.suspicious`. WelcomeEmailListener-style
 * comm-listener отправит email-уведомление пользователю.
 *
 * V1 scope: простые эвристики без GeoIP-lookup. Country detection через
 * maxmind/ip-api добавим в V2 если будет нужно — сейчас IP /16 префикс
 * даёт reasonable signal без external dependencies / lookups.
 *
 * Ложноположительные:
 * - User в роуминге (РФ → IN при выезде в путешествие — типичный сценарий)
 * - Mobile network handover (4G ↔ WiFi)
 * - VPN на новом сервере
 *
 * Ложноотрицательные:
 * - Атакующий из той же страны/провайдера (ред корнер case)
 *
 * Tradeoff: лучше иногда уведомить «не вы?» чем пропустить compromised account.
 * Email-уведомление — soft signal, не блокирующий. User не получает session
 * blocked — он сам идёт через password reset (#134) если что не так.
 */
import { Injectable, Logger } from '@nestjs/common';

import { OutboxService } from '../../../common/outbox/outbox.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface LoginContext {
  ip?: string | undefined;
  userAgent?: string | undefined;
}

@Injectable()
export class SuspiciousLoginDetector {
  private readonly logger = new Logger(SuspiciousLoginDetector.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Проверить сессию на подозрительность и опубликовать event при обнаружении.
   *
   * Вызывается из LoginService.issueTokensForUser после создания новой Session.
   * Не throw'ает — детекция soft-signal, не должна блокировать login.
   *
   * @param userId
   * @param newSessionId — id только что созданной Session
   * @param context     — ip + userAgent текущего login'а
   */
  async check(userId: string, newSessionId: string, context: LoginContext): Promise<void> {
    const ip = context.ip;
    const userAgent = context.userAgent;
    if (!ip || !userAgent) {
      // Без ip/UA эвристика бесполезна — пропускаем.
      return;
    }

    // Берём предыдущую активную Session (исключая только что созданную).
    // Активная = revokedAt IS NULL и не expired. Сортируем по createdAt DESC.
    const previous = await this.prisma.session.findFirst({
      where: {
        userId,
        id: { not: newSessionId },
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: { ip: true, userAgent: true, createdAt: true },
    });

    if (!previous?.ip || !previous.userAgent) {
      // Первый login в системе или предыдущий без IP/UA — нечем сравнивать.
      this.logger.debug({ userId }, 'suspicious.skip.no-baseline');
      return;
    }

    const ipChanged = !sameIpPrefix(previous.ip, ip);
    const uaChanged = !similarUserAgent(previous.userAgent, userAgent);

    if (!ipChanged && !uaChanged) {
      return; // Привычный паттерн — ок.
    }

    const reasons: string[] = [];
    if (ipChanged) reasons.push('ip-changed');
    if (uaChanged) reasons.push('ua-changed');

    this.logger.warn({ userId, sessionId: newSessionId, reasons }, 'auth.suspicious.detected');

    // Публикуем event через outbox (отдельная транзакция от login — детектор
    // вызывается ПОСЛЕ commit'а Session create, поэтому обёртка $transaction
    // нужна только чтобы outbox.add работал).
    await this.prisma.$transaction(async (tx) => {
      await this.outbox.add(tx, {
        type: 'auth.session.suspicious',
        schemaVersion: 1,
        actor: { type: 'system' },
        payload: {
          userId,
          sessionId: newSessionId,
          reasons,
          // ip/userAgent для email — full IP не публикуем (privacy).
          // В email будет первые 2 октета + asterisks.
          ipMasked: maskIp(ip),
          userAgent: userAgent.slice(0, 200),
          previousSessionAt: previous.createdAt.toISOString(),
        },
      });
    });
  }
}

/**
 * Сравнение IP по /16 префиксу (первые 2 октета IPv4).
 * Для IPv6 — первые 4 hextet'а.
 *
 * V1 эвристика — упрощённо. V2: GeoIP country comparison.
 */
function sameIpPrefix(prev: string, current: string): boolean {
  if (prev === current) return true;

  // IPv4
  if (prev.includes('.') && current.includes('.')) {
    const a = prev.split('.').slice(0, 2).join('.');
    const b = current.split('.').slice(0, 2).join('.');
    return a === b;
  }

  // IPv6
  if (prev.includes(':') && current.includes(':')) {
    const a = prev.split(':').slice(0, 4).join(':');
    const b = current.split(':').slice(0, 4).join(':');
    return a === b;
  }

  // Mismatch families (IPv4 vs IPv6) — точно изменилось.
  return false;
}

/**
 * Two UA близки если первые 50 chars совпадают. Простая эвристика — у browser'ов
 * этот префикс содержит OS+browser+version. Минорная смена version (4.20 → 4.21)
 * не считается suspicious; смена browser/OS — считается.
 */
function similarUserAgent(prev: string, current: string): boolean {
  return prev.slice(0, 50) === current.slice(0, 50);
}

/**
 * Маскировка IP для email-payload: 192.168.X.X для IPv4.
 * Privacy-by-default — клиент видит «вы зашли из подсети 192.168.*.*»
 * без точного IP.
 */
function maskIp(ip: string): string {
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[1]}.*.*`;
    }
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 2).join(':')}::*`;
  }
  return '<masked>';
}
