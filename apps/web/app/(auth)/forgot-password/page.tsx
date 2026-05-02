'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { authApi } from '../../../lib/auth/api';

/**
 * /forgot-password — запрос ссылки для сброса пароля (#A-12).
 *
 * Anti-enumeration: backend всегда возвращает 204, независимо от того
 * существует email или нет. Frontend показывает generic-сообщение
 * «если email есть, ссылка отправлена».
 */

export default function ForgotPasswordPage(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await authApi.requestPasswordReset(email.trim().toLowerCase());
      setSubmitted(true);
    } catch {
      // 204 anti-enumeration: ошибка возможна только при сетевой проблеме или 429.
      setError('Не удалось отправить запрос. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6 rounded-2xl bg-card p-6 shadow-sm sm:p-8">
        <header className="space-y-2">
          <h1 className="font-serif text-2xl font-medium tracking-tight">Проверьте почту</h1>
          <p className="text-sm text-muted-foreground">
            Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля. Проверьте
            также папку «Спам».
          </p>
        </header>
        <p className="text-sm text-muted-foreground">
          Ссылка действует 1 час. Если не получили письмо в течение 5 минут — попробуйте запросить
          ещё раз.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              setEmail('');
            }}
          >
            Запросить ещё раз
          </Button>
          <Link
            href="/login"
            className="text-center text-sm font-medium text-primary hover:underline"
          >
            ← Вернуться ко входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-6 rounded-2xl bg-card p-6 shadow-sm sm:p-8"
    >
      <header className="space-y-2">
        <h1 className="font-serif text-2xl font-medium tracking-tight">Восстановление пароля</h1>
        <p className="text-sm text-muted-foreground">
          Укажите email от вашего аккаунта — отправим ссылку для смены пароля.
        </p>
      </header>

      <Field
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
        placeholder="vy@example.com"
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={!email.trim() || submitting} width="full">
        {submitting ? 'Отправка…' : 'Отправить ссылку'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Вспомнили пароль?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Войти
        </Link>
      </p>
    </form>
  );
}
