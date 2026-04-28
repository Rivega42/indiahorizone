/**
 * Seed admin — bootstrap первого admin'а из ENV для dev/staging.
 *
 * Запуск (см. docs/OPS/BOOTSTRAP.md):
 *   ADMIN_BOOTSTRAP_EMAIL=... ADMIN_BOOTSTRAP_PASSWORD=... \
 *     pnpm --filter @indiahorizone/api db:seed:admin
 *
 * После первого деплоя БД пуста — войти в /login нечем. Статичный seed-юзер
 * в коде = пароль в git = security-bug. Решение: env-переменные, которые Вика
 * экспортирует только на момент запуска, потом unset. См. issue #328.
 *
 * Идемпотентность: upsert по email. Если user уже существует — обновляется
 * ТОЛЬКО passwordHash (ротация пароля повторным запуском). role и status
 * НЕ перезаписываются — защита от privilege escalation, если ADMIN_BOOTSTRAP_EMAIL
 * случайно совпадёт с email существующего клиента.
 *
 * Без env — exit 0 (no-op). Можно безопасно включить в CI/deploy-pipeline.
 *
 * Issue: #328 [M5.B.13]
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import zxcvbn from 'zxcvbn';

// рекомендация: ARGON2_OPTIONS должны совпадать с password.service.ts:9.
// Расхождение не сломает login (argon2 хранит параметры в хеше, login сделает
// silent-rehash при первом успехе) — но при ревизии security-параметров обновлять
// нужно ОБА места. Долгосрочно — вынести в отдельный constants-модуль.
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

// рекомендация: совпадает с MIN_ZXCVBN_SCORE в password.service.ts:5.
const MIN_ZXCVBN_SCORE = 2;
const MIN_PASSWORD_LENGTH = 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const prisma = new PrismaClient();

interface BootstrapEnv {
  email: string;
  password: string;
}

function readEnv(): BootstrapEnv | null {
  const rawEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!rawEmail && !password) {
    return null;
  }
  if (!rawEmail || !password) {
    throw new Error(
      'обе переменные ADMIN_BOOTSTRAP_EMAIL и ADMIN_BOOTSTRAP_PASSWORD должны быть заданы (или ни одной)',
    );
  }

  const email = rawEmail.toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new Error(`ADMIN_BOOTSTRAP_EMAIL некорректен: "${email}"`);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `пароль слишком короткий (${password.length} < ${MIN_PASSWORD_LENGTH} символов)`,
    );
  }

  const strength = zxcvbn(password, [email]);
  if (strength.score < MIN_ZXCVBN_SCORE) {
    const hint =
      strength.feedback.warning ||
      strength.feedback.suggestions[0] ||
      'добавь длины и непредсказуемых символов';
    throw new Error(
      `пароль слишком слабый (zxcvbn score ${strength.score} < ${MIN_ZXCVBN_SCORE}): ${hint}`,
    );
  }

  return { email, password };
}

async function main(): Promise<void> {
  const env = readEnv();
  if (!env) {
    // eslint-disable-next-line no-console
    console.log('[seed:admin] ADMIN_BOOTSTRAP_* не заданы — пропускаю (no-op)');
    return;
  }

  const passwordHash = await argon2.hash(env.password, ARGON2_OPTIONS);

  const existing = await prisma.user.findUnique({
    where: { email: env.email },
    select: { id: true, role: true, status: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash },
    });
    // eslint-disable-next-line no-console
    console.log(
      `✓ [seed:admin] password updated for ${env.email} ` +
        `(role=${existing.role}, status=${existing.status} — unchanged)`,
    );
    return;
  }

  await prisma.user.create({
    data: {
      email: env.email,
      passwordHash,
      role: 'admin',
      status: 'active',
    },
  });
  // eslint-disable-next-line no-console
  console.log(`✓ [seed:admin] admin created: ${env.email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed:admin] failed:', err instanceof Error ? err.message : err);
    void prisma.$disconnect().finally(() => process.exit(1));
  });
