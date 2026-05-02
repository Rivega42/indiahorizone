'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { getErrorMessage, isApiError } from '../../../lib/api/client';
import { authApi } from '../../../lib/auth/api';

/**
 * /reset-password?token=... — установка нового пароля (#A-12).
 *
 * Token из email-ссылки. TTL 1 час, 401 при истёкшем/неверном.
 * При успехе — редирект на /login (без автологина: безопасно требовать
 * явную авторизацию с новым паролем).
 */

const MIN_PASSWORD = 8;

export default function ResetPasswordPage(): React.ReactElement {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Загрузка…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm(): React.ReactElement {
  const router = useRouter();
  const search = useSearchParams();
  const token = search?.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!password || submitting) return;
    if (password.length < MIN_PASSWORD) {
      setError(`Пароль минимум ${MIN_PASSWORD} символов.`);
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authApi.confirmPasswordReset(token, password);
      router.replace('/login?reset=success');
    } catch (err: unknown) {
      if (isApiError(err) && err.response?.status === 401) {
        setError('Ссылка устарела или уже использована. Запросите новую.');
      } else {
        setError(getErrorMessage(err, 'Не удалось установить пароль. Попробуйте ещё раз.'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-6 rounded-2xl bg-card p-6 shadow-sm sm:p-8">
        <header className="space-y-2">
          <h1 className="font-serif text-2xl font-medium tracking-tight">Ссылка повреждена</h1>
          <p className="text-sm text-muted-foreground">
            Не указан токен сброса. Запросите новую ссылку из формы восстановления.
          </p>
        </header>
        <Link
          href="/forgot-password"
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          → Запросить ссылку
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-6 rounded-2xl bg-card p-6 shadow-sm sm:p-8"
    >
      <header className="space-y-2">
        <h1 className="font-serif text-2xl font-medium tracking-tight">Новый пароль</h1>
        <p className="text-sm text-muted-foreground">
          Минимум {MIN_PASSWORD} символов. После сохранения войдите с новым паролем.
        </p>
      </header>

      <div className="space-y-1.5">
        <Label htmlFor="password" required>
          Пароль
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            minLength={MIN_PASSWORD}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Field
        label="Подтверждение"
        type={show ? 'text' : 'password'}
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={MIN_PASSWORD}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={!password || !confirm || submitting} width="full">
        {submitting ? 'Сохранение…' : 'Сохранить пароль'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          ← Вернуться ко входу
        </Link>
      </p>
    </form>
  );
}
