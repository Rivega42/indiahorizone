'use client';

/**
 * EnableNotificationsButton (#356).
 *
 * Универсальный UI для настройки push-уведомлений с авто-detection платформы:
 * - iOS Safari НЕ в standalone → инструкция «Добавить на главный экран»
 * - Permission уже granted → «Уведомления включены» (disabled)
 * - Permission denied → пояснение «Включить можно в настройках устройства»
 * - Default → кнопка «Включить уведомления» вызывает subscribePush()
 * - Unsupported → ничего не показываем (no-op)
 *
 * Использование (в /profile/notifications или welcome-баннере):
 *   <EnableNotificationsButton />
 *
 * Backend (#163 push provider) пока не готов — после успешной подписки
 * subscribePush() silently-fails при 404 на /comm/push/subscribe. Когда
 * backend будет, никаких изменений в этом компоненте делать не нужно.
 */

import { useState } from 'react';

import { IosInstallInstructions } from './ios-install-instructions';
import { subscribePush } from '../../lib/push/subscribe';
import { usePushSupport } from '../../lib/push/use-push-support';

export function EnableNotificationsButton(): JSX.Element | null {
  const support = usePushSupport();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (support.state === 'loading') {
    // SSR + первый client-render — рендерим placeholder той же формы,
    // чтобы избежать layout shift.
    return <div className="h-10" aria-hidden="true" />;
  }

  if (support.state === 'unsupported') {
    return null;
  }

  if (support.state === 'ios-needs-install') {
    return <IosInstallInstructions />;
  }

  if (support.state === 'permission-granted' || success) {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        Уведомления включены
      </p>
    );
  }

  if (support.state === 'permission-denied') {
    return (
      <p className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
        Уведомления отключены. Включить можно в настройках браузера или устройства — найдите
        IndiaHorizone в списке сайтов с уведомлениями и разрешите.
      </p>
    );
  }

  // 'ready' — можно показывать кнопку
  const handleClick = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    const result = await subscribePush();
    setBusy(false);
    if (result.ok) {
      setSuccess(true);
      return;
    }
    if (result.reason === 'denied') {
      setError('Вы отказались от разрешения. Включить можно в настройках браузера.');
      return;
    }
    if (result.reason === 'no-vapid-key') {
      setError('Сервис уведомлений ещё не настроен. Попробуйте позже.');
      return;
    }
    setError('Не удалось подключить уведомления. Попробуйте ещё раз.');
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => {
          void handleClick();
        }}
        disabled={busy}
        className="inline-flex h-10 items-center justify-center rounded-md bg-stone-900 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Подключаем…' : 'Включить уведомления'}
      </button>
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
