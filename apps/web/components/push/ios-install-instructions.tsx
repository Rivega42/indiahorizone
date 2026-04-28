'use client';

/**
 * iOS Install Instructions (#356).
 *
 * Объясняет пользователю iOS Safari, как добавить сайт на главный экран —
 * единственный способ получать Web Push на iOS 16.4+.
 *
 * Тон: helpful guide, не technical disclaimer. Не валим Apple — просто
 * объясняем шаги.
 *
 * Иконка share `⎙` — Unicode-символ. Это компромисс: настоящая иконка iOS
 * (кнопка-стрелка вверх в квадрате) — proprietary, в шрифтах нет.
 * При необходимости заменим на inline SVG в дизайн-итерации (#312-318).
 */

interface IosInstallInstructionsProps {
  /** Опционально: callback когда пользователь подтвердил «понятно». */
  onDismiss?: () => void;
}

export function IosInstallInstructions({ onDismiss }: IosInstallInstructionsProps): JSX.Element {
  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      role="region"
      aria-label="Как включить уведомления на iPhone"
    >
      <h4 className="text-base font-semibold">Чтобы получать уведомления на iPhone</h4>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5">
        <li>
          Нажмите кнопку{' '}
          <span
            aria-label="Поделиться"
            className="inline-flex h-5 w-5 items-center justify-center rounded border border-amber-300 align-middle text-xs"
          >
            ⎙
          </span>{' '}
          «Поделиться» внизу Safari
        </li>
        <li>
          Прокрутите вниз и выберите <strong className="font-semibold">«На экран Домой»</strong>
        </li>
        <li>Откройте IndiaHorizone с главного экрана — появится отдельная иконка</li>
        <li>Снова зайдите в этот раздел и включите уведомления</li>
      </ol>
      <p className="mt-3 text-xs text-amber-800">
        На Android и компьютере уведомления работают сразу в браузере.
      </p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-3 text-xs font-medium text-amber-900 underline underline-offset-2 hover:text-amber-700"
        >
          Понятно
        </button>
      ) : null}
    </div>
  );
}
