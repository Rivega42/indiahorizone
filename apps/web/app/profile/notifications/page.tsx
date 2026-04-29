'use client';

/**
 * /profile/notifications — управление уведомлениями (#163 + #166).
 *
 * 3 секции:
 * 1. EnableNotificationsButton — подписать текущее устройство (или показать iOS-инструкцию)
 * 2. Preferences — checkboxes по 4 категориям × 4 каналам (SOS protected)
 * 3. Devices — список активных push-устройств с возможностью удаления
 *
 * Auth required — без accessToken компонент покажет CTA на /login.
 *
 * Note: client component целиком — все три секции interactive (subscribe, toggle preferences, delete device).
 */

import { useEffect, useState } from 'react';

import { EnableNotificationsButton } from '@/components/push/enable-notifications-button';
import {
  listPreferences,
  updatePreference,
  type NotificationCategory,
  type NotificationChannel,
  type PreferenceItem,
} from '@/lib/api/preferences';
import {
  listPushSubscriptions,
  unsubscribePushById,
  type PushSubscriptionItem,
} from '@/lib/api/push-subscriptions';
import { useCurrentUser } from '@/lib/auth/store';

const CATEGORY_LABELS: Record<NotificationCategory, { name: string; description: string }> = {
  trips: {
    name: 'Поездки',
    description: 'Статусы вашей поездки, напоминания, изменения программы',
  },
  marketing: {
    name: 'Маркетинг',
    description: 'Новые туры и спецпредложения. По умолчанию выключено (152-ФЗ)',
  },
  sos: {
    name: 'SOS',
    description: 'Экстренные уведомления. Нельзя отключить (требование безопасности)',
  },
  system: {
    name: 'Безопасность',
    description: 'Подозрительный вход, смена пароля, важные системные события',
  },
};

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  push: 'Push',
  email: 'Email',
  sms: 'SMS',
  telegram: 'Telegram',
};

export default function NotificationsProfilePage(): React.ReactElement {
  const user = useCurrentUser();

  if (user === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-medium">Уведомления</h1>
        <p className="mt-4 text-muted-foreground">
          Войдите чтобы настроить уведомления.{' '}
          <a href="/login" className="font-medium text-primary hover:underline">
            Войти →
          </a>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-10 px-6 py-12 sm:py-16">
      <header>
        <h1 className="font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          Уведомления
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Настройте, что и куда мы вам отправляем. Выключенные типы можно вернуть в любой момент.
        </p>
      </header>

      <section>
        <h2 className="font-serif text-xl font-medium">Push на этом устройстве</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Подключите push, чтобы получать уведомления когда сайт закрыт.
        </p>
        <div className="mt-4">
          <EnableNotificationsButton />
        </div>
      </section>

      <PreferencesSection />

      <DevicesSection />
    </main>
  );
}

// ─────────────────────────────────────── Preferences

function PreferencesSection(): React.ReactElement {
  const [items, setItems] = useState<PreferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    listPreferences()
      .then((res) => setItems(res.items))
      .catch((err: unknown) => {
        console.error('[preferences] list failed', err);
        setError('Не удалось загрузить настройки.');
      })
      .finally(() => setLoading(false));
  }, []);

  async function toggleChannel(
    category: NotificationCategory,
    channel: NotificationChannel,
    nextChannels: NotificationChannel[],
  ): Promise<void> {
    setSavingKey(`${category}:${channel}`);
    setError(null);
    try {
      const updated = await updatePreference(category, { channels: nextChannels });
      setItems((prev) => prev.map((i) => (i.category === category ? updated : i)));
    } catch (err: unknown) {
      console.error('[preferences] update failed', err);
      setError(
        `Не удалось обновить ${CATEGORY_LABELS[category].name} → ${CHANNEL_LABELS[channel]}`,
      );
    } finally {
      setSavingKey(null);
    }
  }

  async function toggleEnabled(
    category: NotificationCategory,
    nextEnabled: boolean,
  ): Promise<void> {
    setSavingKey(`${category}:enabled`);
    setError(null);
    try {
      const updated = await updatePreference(category, { enabled: nextEnabled });
      setItems((prev) => prev.map((i) => (i.category === category ? updated : i)));
    } catch (err: unknown) {
      console.error('[preferences] update enabled failed', err);
      setError(
        `Не удалось ${nextEnabled ? 'включить' : 'отключить'} ${CATEGORY_LABELS[category].name}`,
      );
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return (
      <section>
        <h2 className="font-serif text-xl font-medium">Категории</h2>
        <p className="mt-2 text-sm text-muted-foreground">Загружаем настройки…</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-serif text-xl font-medium">Категории</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Каждую категорию можно отключить целиком или выбрать каналы доставки.
      </p>

      {error ? (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        {items.map((item) => {
          const labels = CATEGORY_LABELS[item.category];
          const isProtected = item.category === 'sos';
          return (
            <article
              key={item.category}
              className="rounded-lg border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">{labels.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{labels.description}</p>
                </div>
                <label
                  className={`relative inline-flex cursor-pointer items-center ${
                    isProtected ? 'pointer-events-none opacity-60' : ''
                  }`}
                  aria-label={`Включить ${labels.name}`}
                >
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    disabled={isProtected || savingKey === `${item.category}:enabled`}
                    onChange={(e) => {
                      void toggleEnabled(item.category, e.target.checked);
                    }}
                    className="peer sr-only"
                  />
                  <span className="h-6 w-11 rounded-full bg-stone-300 transition peer-checked:bg-primary" />
                  <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:left-5" />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(['push', 'email', 'sms', 'telegram'] as NotificationChannel[]).map((ch) => {
                  const isOn = item.channels.includes(ch);
                  const key = `${item.category}:${ch}`;
                  return (
                    <button
                      key={ch}
                      type="button"
                      disabled={
                        savingKey === key ||
                        !item.enabled ||
                        (isProtected && isOn && item.channels.length === 1)
                      }
                      onClick={() => {
                        const nextChannels = isOn
                          ? item.channels.filter((c) => c !== ch)
                          : [...item.channels, ch];
                        void toggleChannel(item.category, ch, nextChannels);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                        isOn
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {CHANNEL_LABELS[ch]}
                      {isOn ? <span aria-hidden>✓</span> : null}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────── Devices

function DevicesSection(): React.ReactElement {
  const [items, setItems] = useState<PushSubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    listPushSubscriptions()
      .then((res) => setItems(res.items))
      .catch((err: unknown) => {
        console.error('[devices] list failed', err);
        setError('Не удалось загрузить устройства.');
      })
      .finally(() => setLoading(false));
  }, []);

  async function remove(id: string): Promise<void> {
    setRemoving(id);
    setError(null);
    try {
      await unsubscribePushById(id);
      setItems((prev) => prev.filter((d) => d.id !== id));
    } catch (err: unknown) {
      console.error('[devices] remove failed', err);
      setError('Не удалось отписать устройство.');
    } finally {
      setRemoving(null);
    }
  }

  if (loading) {
    return (
      <section>
        <h2 className="font-serif text-xl font-medium">Подключённые устройства</h2>
        <p className="mt-2 text-sm text-muted-foreground">Загружаем…</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-serif text-xl font-medium">Подключённые устройства</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Здесь видны устройства, на которых включены push. Можно отключить любое.
      </p>

      {error ? (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
          Push не подключён ни на одном устройстве.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium">{d.deviceLabel ?? 'Устройство'}</div>
                <div className="text-xs text-muted-foreground">
                  Добавлено: {formatDate(d.createdAt)}
                  {d.lastSeenAt
                    ? ` · последний push: ${formatDate(d.lastSeenAt)}`
                    : ' · push ещё не приходили'}
                </div>
              </div>
              <button
                type="button"
                disabled={removing === d.id}
                onClick={() => {
                  void remove(d.id);
                }}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
              >
                {removing === d.id ? 'Удаляем…' : 'Отписать'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
