'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { getErrorMessage } from '../../../lib/api/client';
import { useLogin } from '../../../lib/auth/hooks';

/**
 * Login screen.
 *
 * Соответствует prototype:
 * docs/UX/prototypes/from-claude-design/project/ui_kits/trip_dashboard/AuthScreens.jsx
 *
 * Что улучшено по сравнению с prototype'ом (см. ревью в #257):
 * - shadcn primitives через CSS-vars (dark-mode работает из коробки)
 * - password show/hide toggle (mobile + Cyrillic UX)
 * - aria-invalid + aria-describedby через <Field>
 * - Generic error message «Неверный email или пароль» (anti-enumeration)
 *
 * 2FA challenge редирект (#133) — добавится позже когда login начнёт
 * возвращать `{ challengeId }` вместо токенов.
 */
export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    login.mutate(
      { email: email.trim().toLowerCase(), password },
      {
        onSuccess: () => {
          router.push('/trips');
        },
      },
    );
  }

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">С возвращением</h1>
        <p className="text-sm text-muted-foreground">Войдите в Trip Dashboard</p>
      </div>

      {login.isError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{getErrorMessage(login.error, 'Не удалось войти')}</AlertDescription>
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
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password" required>
              Пароль
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Забыли пароль?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
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
        </div>

        <Button type="submit" width="full" size="lg" disabled={login.isPending}>
          {login.isPending ? 'Входим…' : 'Войти'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Ещё нет аккаунта?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
