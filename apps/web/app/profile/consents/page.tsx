'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  getActiveConsents,
  grantConsent,
  listConsents,
  revokeConsent,
  type Consent,
  type ConsentType,
} from '@/lib/api/consents';
import { useCurrentUser } from '@/lib/auth/store';
import { CONSENT_VERSION } from '@/lib/legal/versions';

/**
 * /profile/consents — управление 4 granular-согласиями (#A-06).
 *
 * Toggle на каждой позиции:
 * - Включение → POST /consents/{type} с актуальной CONSENT_VERSION.
 * - Отключение → confirm-modal → DELETE /consents/{type}.
 *
 * История версий: «вы согласились на 0.1.0 от 28 апреля 2026».
 *
 * Marketing — opt-in (152-ФЗ). По умолчанию выключен.
 */

interface ConsentMeta {
  type: ConsentType;
  title: string;
  description: string;
  /** Что перестанет работать при отзыве */
  revokeWarning: string;
}

const CONSENTS: ConsentMeta[] = [
  {
    type: 'photo_video',
    title: 'Фото и видео',
    description: 'Использование фото/видео в дневнике поездки, маркетинге и соцсетях.',
    revokeWarning: 'Дневник поездки больше не будет содержать фото от гида и ваши видео-кружки.',
  },
  {
    type: 'geo',
    title: 'Геолокация',
    description: 'Передача координат при SOS-сигнале и live-tracking во время поездки.',
    revokeWarning: 'SOS-кнопка не сможет автоматически передать ваше местоположение concierge.',
  },
  {
    type: 'emergency_contacts',
    title: 'Передача экстренным контактам',
    description: 'Доступ к передаче ваших контактов экстренной связи при ЧП.',
    revokeWarning:
      'При SOS гид не сможет связаться с вашими экстренными контактами — только лично с вами.',
  },
  {
    type: 'marketing',
    title: 'Маркетинговые сообщения',
    description: 'Спецпредложения, новые туры, акции. Можно отозвать в любой момент.',
    revokeWarning: 'Вы перестанете получать информацию о новых турах и акциях.',
  },
];

interface ConfirmRevoke {
  type: ConsentType;
  warning: string;
}

function formatGrantedAt(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export default function ConsentsPage(): React.ReactElement {
  const user = useCurrentUser();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Set<ConsentType>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRevoke | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    listConsents()
      .then((data) => {
        if (!cancelled) setConsents(data);
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить согласия.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const active = getActiveConsents(consents);

  function setBusy(type: ConsentType, busy: boolean): void {
    setPending((prev) => {
      const next = new Set(prev);
      if (busy) next.add(type);
      else next.delete(type);
      return next;
    });
  }

  async function handleGrant(type: ConsentType): Promise<void> {
    setBusy(type, true);
    setError(null);
    try {
      const granted = await grantConsent(type, { version: CONSENT_VERSION });
      setConsents((prev) => [...prev.filter((c) => c.id !== granted.id), granted]);
    } catch {
      setError('Не удалось включить согласие. Попробуйте ещё раз.');
    } finally {
      setBusy(type, false);
    }
  }

  async function handleRevoke(type: ConsentType): Promise<void> {
    setBusy(type, true);
    setError(null);
    setConfirm(null);
    try {
      await revokeConsent(type);
      const refreshed = await listConsents();
      setConsents(refreshed);
    } catch {
      setError('Не удалось отозвать согласие. Попробуйте ещё раз.');
    } finally {
      setBusy(type, false);
    }
  }

  if (user === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-medium">Согласия</h1>
        <p className="mt-4 text-muted-foreground">
          Войдите чтобы управлять согласиями.{' '}
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
          Согласия
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Управление обработкой ваших данных согласно 152-ФЗ. Каждое согласие можно отозвать в любой
          момент — данные удалятся в течение 7 дней.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <ul className="space-y-4">
          {CONSENTS.map((meta) => {
            const current = active.get(meta.type);
            const isOn = Boolean(current);
            const busy = pending.has(meta.type);
            return (
              <li key={meta.type} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium">{meta.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
                    {current ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Согласие v{current.version} от {formatGrantedAt(current.grantedAt)}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isOn}
                    disabled={busy}
                    onClick={() => {
                      if (busy) return;
                      if (isOn) {
                        setConfirm({ type: meta.type, warning: meta.revokeWarning });
                      } else {
                        void handleGrant(meta.type);
                      }
                    }}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
                      isOn ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                        isOn ? 'left-5' : 'left-0.5'
                      }`}
                      aria-hidden
                    />
                    <span className="sr-only">
                      {isOn ? `Отозвать ${meta.title}` : `Включить ${meta.title}`}
                    </span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {confirm ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h3 id="confirm-title" className="font-medium">
              Отозвать согласие?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{confirm.warning}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Связанные данные удалятся в течение 7 дней.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => void handleRevoke(confirm.type)}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
              >
                Отозвать
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
