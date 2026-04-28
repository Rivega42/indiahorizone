'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { getErrorMessage } from '../../../lib/api/client';
import { useLogin, useRegister } from '../../../lib/auth/hooks';
import { cn } from '../../../lib/utils';

const PASSWORD_LABELS = ['Очень слабый', 'Слабый', 'Средний', 'Хороший', 'Отличный'];
const PASSWORD_COLORS = [
  'bg-destructive',
  'bg-destructive',
  'bg-warning',
  'bg-success',
  'bg-success',
];

/**
 * Простой password strength estimator. Не replaces zxcvbn — это
 * lightweight feedback для UX. Реальный score проверяется на backend через
 * zxcvbn (issue #127, PasswordService.checkStrength) — публичный API
 * вернёт 422 «Пароль слишком слабый» с реальной оценкой.
 *
 * TODO (#135 follow-up): подключить @zxcvbn-ts/core с RU dictionary
 * для совпадения backend↔frontend score.
 */
function estimateStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-ZА-Я]/.test(password) && /[a-zа-я]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Zа-яА-Я0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

export default function RegisterPage(): React.ReactElement {
  const router = useRouter();
  const register = useRegister();
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const strength = useMemo(() => estimateStrength(password), [password]);
  const passwordTooShort = password.length > 0 && password.length < 12;

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!agreed || passwordTooShort) return;

    const cleanEmail = email.trim().toLowerCase();
    register.mutate(
      { email: cleanEmail, password },
      {
        onSuccess: () => {
          // Auto-login после успешной регистрации
          login.mutate(
            { email: cleanEmail, password },
            {
              onSuccess: () => router.push('/trips'),
            },
          );
        },
      },
    );
  }

  const submitting = register.isPending || login.isPending;
  const error = register.error ?? login.error;

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Создать аккаунт</h1>
        <p className="text-sm text-muted-foreground">
          Зарегистрируйтесь, чтобы получить доступ к Trip Dashboard
        </p>
      </div>

      {error != null && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {getErrorMessage(error, 'Не удалось создать аккаунт')}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vy@example.com"
        />

        <div className="space-y-1.5">
          <Label htmlFor="register-password" required>
            Пароль
          </Label>
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              aria-describedby="register-password-helper"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex gap-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors duration-fast',
                  password.length > 0 && strength > i ? PASSWORD_COLORS[strength] : 'bg-muted',
                )}
              />
            ))}
          </div>

          <p
            id="register-password-helper"
            className={cn(
              'text-xs',
              passwordTooShort ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {passwordTooShort
              ? 'Минимум 12 символов'
              : password
                ? `${PASSWORD_LABELS[strength]} · мин. 12 символов`
                : 'Минимум 12 символов. Подсказка: используйте фразу из 3–4 слов'}
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-describedby="terms-text"
          />
          <span id="terms-text" className="text-xs leading-relaxed text-muted-foreground">
            Я согласен с{' '}
            <Link href="/legal/offer" className="text-primary hover:underline">
              офертой
            </Link>{' '}
            и{' '}
            <Link href="/legal/privacy" className="text-primary hover:underline">
              политикой обработки данных
            </Link>
            .
          </span>
        </label>

        <Button
          type="submit"
          width="full"
          size="lg"
          disabled={submitting || !agreed || passwordTooShort}
        >
          {submitting ? 'Создаём…' : 'Создать аккаунт'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
