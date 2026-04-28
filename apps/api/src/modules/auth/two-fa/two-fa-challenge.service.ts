/**
 * TwoFaChallengeService — короткоживущие 2FA challenges в Redis (issue #133).
 *
 * Когда пользователь с активированным 2FA шлёт POST /auth/login и пароль
 * верный — мы НЕ выпускаем токены, а создаём challenge:
 *   challengeId (random UUIDv4) → userId, TTL 5 мин
 * И возвращаем юзеру `{ challengeId }`. Юзер вводит TOTP/recovery код
 * на втором экране, шлёт POST /auth/2fa/verify { challengeId, code },
 * и только тогда получает токены.
 *
 * Rate-limit: 5 попыток на challengeId (атакующий не может бомбардировать
 * один challenge). После исчерпания попыток challenge удаляется → юзер
 * должен пройти password-step заново.
 */
import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '../../../common/redis/redis.service';

const CHALLENGE_TTL_SEC = 5 * 60; // 5 минут
const MAX_ATTEMPTS = 5;
const KEY_PREFIX = '2fa-challenge';

interface ChallengePayload {
  userId: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class TwoFaChallengeService {
  private readonly logger = new Logger(TwoFaChallengeService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Создать challenge для user'а после successful password verify.
   * Возвращает challengeId для отдачи клиенту.
   */
  async create(payload: ChallengePayload): Promise<string> {
    const challengeId = randomUUID();
    await this.redis
      .getClient()
      .set(this.dataKey(challengeId), JSON.stringify(payload), 'EX', CHALLENGE_TTL_SEC);
    return challengeId;
  }

  /**
   * Atomically: increment attempts + read payload.
   *
   * @returns null если challenge не найден (TTL истёк / уже использован)
   *          или превышен лимит попыток (auto-cleanup).
   */
  async consumeAttempt(
    challengeId: string,
  ): Promise<{ attempt: number; payload: ChallengePayload } | null> {
    const dataKey = this.dataKey(challengeId);
    const attemptsKey = this.attemptsKey(challengeId);

    const raw = await this.redis.getClient().get(dataKey);
    if (!raw) {
      return null;
    }

    const attempt = await this.redis.getClient().incr(attemptsKey);
    // Counter живёт столько же, сколько challenge — устанавливаем TTL только
    // на первой инкрементации (когда attempt=1).
    if (attempt === 1) {
      await this.redis.getClient().expire(attemptsKey, CHALLENGE_TTL_SEC);
    }

    if (attempt > MAX_ATTEMPTS) {
      this.logger.warn({ challengeId, attempt }, '2fa.challenge.attempts-exceeded');
      await this.cleanup(challengeId);
      return null;
    }

    const payload = JSON.parse(raw) as ChallengePayload;
    return { attempt, payload };
  }

  /**
   * Удалить challenge после успешной верификации (или превышения лимита).
   */
  async cleanup(challengeId: string): Promise<void> {
    await this.redis.getClient().del(this.dataKey(challengeId), this.attemptsKey(challengeId));
  }

  private dataKey(challengeId: string): string {
    return `${KEY_PREFIX}:${challengeId}`;
  }

  private attemptsKey(challengeId: string): string {
    return `${KEY_PREFIX}:${challengeId}:attempts`;
  }
}
