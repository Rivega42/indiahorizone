'use client';

import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

import { authApi } from '@/lib/auth/api';
import { useCurrentUser } from '@/lib/auth/store';

/**
 * /profile/security/2fa — multi-step wizard для 2FA TOTP enrollment (#A-03).
 *
 * Шаги:
 *  - intro          — описание, кнопка «Включить 2FA»
 *  - scan           — QR из otpauth-URL + manual secret + поле для 6-цифрового кода
 *  - recovery       — 10 recovery-кодов в plaintext + чекбокс «Я сохранил» + copy/download
 *  - success        — итоговый экран
 *  - disable        — если 2FA уже активирован: ввод TOTP/recovery для отключения
 *
 * Отдельная страница, не модал — flow требует фокус, без отвлечений.
 *
 * Auth required. Состояние секрета и recovery-кодов в useState (НЕ в localStorage —
 * security: secret после refresh страницы недоступен на BE, юзер должен начать заново).
 *
 * Связано: #407 (A-03), #438 (disable endpoint).
 */

type Step = 'intro' | 'scan' | 'recovery' | 'success' | 'disable';

interface EnrollData {
  secret: string;
  otpAuthUrl: string;
}

function downloadRecoveryCodes(codes: string[]): void {
  const content = [
    'IndiaHorizone — recovery codes для 2FA.',
    'Сохраните в безопасном месте. Каждый код можно использовать ОДИН раз.',
    '',
    ...codes,
    '',
    `Сгенерировано: ${new Date().toLocaleString('ru-RU')}`,
  ].join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `indiahorizone-recovery-codes-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function TwoFaPage(): React.ReactElement {
  const user = useCurrentUser();
  const [step, setStep] = useState<Step>('intro');
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  async function handleStartEnroll(): Promise<void> {
    setError(null);
    setPending(true);
    try {
      const data = await authApi.enroll2fa();
      setEnrollData(data);
      setStep('scan');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setError('2FA уже активирован. Сначала отключите текущий setup.');
        setStep('disable');
      } else {
        setError('Не удалось начать настройку 2FA. Попробуйте ещё раз.');
      }
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyCode(): Promise<void> {
    if (!/^\d{6}$/.test(code)) {
      setError('Код должен быть 6 цифр');
      return;
    }
    setError(null);
    setPending(true);
    try {
      const result = await authApi.verify2faEnroll(code);
      setRecoveryCodes(result.recoveryCodes);
      setStep('recovery');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError('Неверный код. Проверьте, что время на устройстве синхронизировано.');
      } else {
        setError('Не удалось проверить код. Попробуйте ещё раз.');
      }
    } finally {
      setPending(false);
    }
  }

  function handleConfirmSaved(): void {
    if (!savedConfirmed) return;
    setStep('success');
  }

  async function handleDisable(): Promise<void> {
    if (disableCode.trim().length < 6) {
      setError('Введите TOTP-код или recovery-код');
      return;
    }
    setError(null);
    setPending(true);
    try {
      await authApi.disable2fa(disableCode.trim());
      setStep('intro');
      setDisableCode('');
      setEnrollData(null);
      setRecoveryCodes(null);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError('Неверный код.');
      } else {
        setError('Не удалось отключить 2FA. Попробуйте ещё раз.');
      }
    } finally {
      setPending(false);
    }
  }

  if (user === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-medium">Двухфакторная аутентификация</h1>
        <p className="mt-4 text-muted-foreground">
          Войдите чтобы настроить 2FA.{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Войти →
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12 sm:py-16">
      <header>
        <Link
          href="/profile"
          className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          ← Личный кабинет
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          Двухфакторная аутентификация
        </h1>
      </header>

      {step === 'intro' ? (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">
            2FA добавляет второй фактор при входе — одноразовый код из приложения-аутентификатора
            (Google Authenticator, 1Password, Authy). Даже если злоумышленник узнает пароль — он не
            войдёт без кода с вашего телефона.
          </p>
          <p className="text-sm text-muted-foreground">
            После активации мы сгенерируем 10 recovery-кодов на случай потери телефона. Сохраните их
            в безопасном месте.
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            type="button"
            onClick={() => void handleStartEnroll()}
            disabled={pending}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? 'Подготовка…' : 'Включить 2FA'}
          </button>
        </section>
      ) : null}

      {step === 'scan' && enrollData ? (
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-medium">Шаг 1 — Отсканируйте QR</h2>
            <p className="text-sm text-muted-foreground">
              Откройте Google Authenticator или 1Password и отсканируйте QR-код ниже.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6">
            <div className="rounded-lg bg-white p-4">
              <QRCodeSVG value={enrollData.otpAuthUrl} size={200} level="M" />
            </div>
            <details className="w-full text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Не могу отсканировать — введу секрет вручную
              </summary>
              <div className="mt-3 rounded-lg bg-muted p-3 font-mono text-xs break-all">
                {enrollData.secret}
              </div>
            </details>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-medium">Шаг 2 — Введите код из приложения</h2>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-center font-mono text-lg tracking-[0.3em]"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <button
              type="button"
              onClick={() => void handleVerifyCode()}
              disabled={pending || code.length !== 6}
              className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? 'Проверка…' : 'Подтвердить'}
            </button>
          </div>
        </section>
      ) : null}

      {step === 'recovery' && recoveryCodes ? (
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-medium">Шаг 3 — Сохраните recovery-коды</h2>
            <p className="text-sm text-muted-foreground">
              Если потеряете телефон — войдёте по одному из этих кодов. Каждый код одноразовый.
              <strong> Сейчас их видно в последний раз.</strong>
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
              {recoveryCodes.map((c) => (
                <li key={c} className="rounded-md bg-muted px-3 py-2 text-center tracking-wider">
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void copyToClipboard(recoveryCodes.join('\n')).then((ok) => {
                  if (ok) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                })
              }
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              {copied ? 'Скопировано ✓' : 'Скопировать все'}
            </button>
            <button
              type="button"
              onClick={() => downloadRecoveryCodes(recoveryCodes)}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Скачать .txt
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Распечатать
            </button>
          </div>

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={savedConfirmed}
              onChange={(e) => setSavedConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Я сохранил коды в безопасном месте. Я понимаю, что без них и без телефона восстановить
              доступ не получится.
            </span>
          </label>

          <button
            type="button"
            onClick={handleConfirmSaved}
            disabled={!savedConfirmed}
            className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Готово
          </button>
        </section>
      ) : null}

      {step === 'success' ? (
        <section className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
            <h2 className="text-lg font-medium text-emerald-900 dark:text-emerald-100">
              2FA активирован ✓
            </h2>
            <p className="mt-2 text-sm text-emerald-900/80 dark:text-emerald-100/80">
              При следующем входе вы введёте 6-значный код из authenticator-приложения.
            </p>
          </div>
          <Link
            href="/profile"
            className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Вернуться в профиль
          </Link>
        </section>
      ) : null}

      {step === 'disable' ? (
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-medium">Отключить 2FA</h2>
            <p className="text-sm text-muted-foreground">
              Введите текущий 6-значный код из приложения ИЛИ один из recovery-кодов для
              подтверждения, что это действительно вы.
            </p>
          </div>
          <input
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            placeholder="123456 или XXXX-XXXX-XXXX-XXXX"
            autoComplete="one-time-code"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleDisable()}
              disabled={pending}
              className="rounded-lg border border-destructive/30 bg-background px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              {pending ? 'Отключение…' : 'Отключить 2FA'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('intro');
                setError(null);
                setDisableCode('');
              }}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Отмена
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
