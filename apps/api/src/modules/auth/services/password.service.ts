import { Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import zxcvbn from 'zxcvbn';

const MIN_ZXCVBN_SCORE = 2; // 0–4. 2 = «ок», 3+ = «хорошо», 4 = «отлично».
// На фазу 3 score=2 минимум: пароль не из топ-100k популярных
// и не очевидно слабый. Жёстче не делаем — иначе клиенты бунтуют.

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456, // 19 MiB — OWASP 2024 рекомендация
  timeCost: 2,
  parallelism: 1,
};

export interface PasswordStrengthResult {
  ok: boolean;
  score: number; // 0..4
  warning?: string;
  suggestions: string[];
}

/**
 * PasswordService — единая точка работы с паролями.
 * Все hash/verify проходят здесь, чтобы можно было заменить алгоритм
 * (например при появлении quantum-safe в фазе 5) без правки caller'ов.
 */
@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  /**
   * Проверка пароля через zxcvbn. Возвращает score + подсказки на русском.
   * Не блокирует если score >= MIN_ZXCVBN_SCORE; подсказки можно показать
   * клиенту в UI как helper-text.
   */
  checkStrength(password: string, userInputs: string[] = []): PasswordStrengthResult {
    const result = zxcvbn(password, userInputs);
    return {
      ok: result.score >= MIN_ZXCVBN_SCORE,
      score: result.score,
      ...(result.feedback.warning ? { warning: result.feedback.warning } : {}),
      suggestions: result.feedback.suggestions ?? [],
    };
  }

  async hash(password: string): Promise<string> {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  /**
   * Time-constant verify (argon2.verify timing-safe by design).
   * При подозрении что hash был сгенерирован старыми параметрами — возвращает
   * флаг needsRehash, чтобы caller мог пере-хешировать пароль при следующем
   * успешном login (silent upgrade).
   */
  async verify(hash: string, password: string): Promise<{ valid: boolean; needsRehash: boolean }> {
    try {
      const valid = await argon2.verify(hash, password);
      const needsRehash = valid && argon2.needsRehash(hash, ARGON2_OPTIONS);
      return { valid, needsRehash };
    } catch (error) {
      this.logger.warn({ err: error }, 'argon2.verify.failed');
      return { valid: false, needsRehash: false };
    }
  }
}
