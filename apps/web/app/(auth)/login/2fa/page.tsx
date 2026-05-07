'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Button } from '../../../../components/ui/button';
import { Label } from '../../../../components/ui/label';
import { authApi } from '../../../../lib/auth/api';
import { authStore } from '../../../../lib/auth/store';

/**
 * /login/2fa — второй фактор при входе (#A-04).
 *
 * Flow:
 * 1. На /login пользователь ввёл валидный пароль и BE вернул `{ challengeId }`
 *    вместо токенов (потому что у него активирован 2FA).
 * 2. login-страница сохранила challengeId в sessionStorage и редиректит сюда.
 * 3. Пользователь вводит 6-значный TOTP-код (или recovery-код XXXX-XXXX-XXXX-XXXX).
 * 4. Submit → POST /auth/2fa/verify { challengeId, code } → токены или 401.
 * 5. После 3 неверных попыток (или 5 в зависимости от BE) — сервер удаляет
 *    challenge, мы редиректим на /login с тостом «начните заново».
 *
 * Если challengeId отсутствует в sessionStorage (прямой переход / refresh страницы) —
 * редиректим на /login.
 */

const SESSION_KEY = 'ih.2fa.challengeId';
const MAX_ATTEMPTS = 5;

export default function TwoFaChallengePage(): React.ReactElement {
  const router = useRouter();
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(MAX_ATTEMPTS);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) {
      router.replace('/login');
      return;
    }
    setChallengeId(stored);
  }, [router]);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!challengeId) return;

    const trimmed = code.trim();
    if (trimmed.length === 0) return;

    setError(null);
    setPending(true);
    try {
      const result = await authApi.verify2faLogin(challengeId, trimmed);
      // Успех — записываем токены, чистим sessionStorage, редиректим на /trips
      sessionStorage.removeItem(SESSION_KEY);
      authStore.setSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
      router.push('/trips');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        const next = attemptsLeft - 1;
        setAttemptsLeft(next);
        if (next <= 0) {
          sessionStorage.removeItem(SESSION_KEY);
          router.replace('/login?error=2fa-exhausted');
          return;
        }
        setError(`Неверный код. Осталось попыток: ${next}.`);
      } else {
        setError('Не удалось проверить код. Попробуйте ещё раз.');
      }
      setCode('');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Подтверждение входа</h1>
        <p className="text-sm text-muted-foreground">
          {useRecovery
            ? 'Введите один из recovery-кодов (XXXX-XXXX-XXXX-XXXX).'
            : 'Введите 6-значный код из приложения-аутентификатора.'}
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="code">{useRecovery ? 'Recovery-код' : 'Код'}</Label>
          <input
            id="code"
            value={code}
            onChange={(e) => {
              const v = e.target.value;
              if (useRecovery) {
                setCode(v.toLowerCase().slice(0, 19));
              } else {
                setCode(v.replace(/\D/g, '').slice(0, 6));
              }
            }}
            inputMode={useRecovery ? 'text' : 'numeric'}
            autoComplete="one-time-code"
            autoFocus
            required
            placeholder={useRecovery ? 'xxxx-xxxx-xxxx-xxxx' : '123456'}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-center font-mono text-lg tracking-[0.2em]"
          />
        </div>

        <Button type="submit" width="full" size="lg" disabled={pending || code.trim().length === 0}>
          {pending ? 'Проверяем…' : 'Подтвердить'}
        </Button>
      </form>

      <div className="space-y-2 text-center text-sm">
        <button
          type="button"
          onClick={() => {
            setUseRecovery((v) => !v);
            setCode('');
            setError(null);
          }}
          className="font-medium text-primary hover:underline"
        >
          {useRecovery ? 'Использовать код из приложения' : 'Использовать recovery-код'}
        </button>
        <div className="text-muted-foreground">
          Потеряли всё?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Вернуться к входу
          </Link>
        </div>
      </div>
    </div>
  );
}
