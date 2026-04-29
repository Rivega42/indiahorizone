'use client';

import Link from 'next/link';

import { useCurrentUser } from '@/lib/auth/store';

/**
 * /profile — index личного кабинета.
 *
 * Сейчас 1 раздел: Уведомления (#163, #166). Будут добавляться:
 * - Devices (отдельная страница если станет много опций)
 * - Security (2FA, sessions, password)
 * - Trips (history + active)
 * - Documents (паспорт, виза)
 *
 * Auth required.
 */

interface ProfileSection {
  href: string;
  title: string;
  description: string;
  badge?: string;
}

const SECTIONS: ProfileSection[] = [
  {
    href: '/profile/notifications',
    title: 'Уведомления',
    description: 'Push, email, SMS, Telegram. Что и куда вам отправлять.',
  },
  // TODO когда будут готовы:
  // { href: '/profile/security', title: 'Безопасность', description: 'Пароль, 2FA, активные сессии', badge: 'Скоро' },
  // { href: '/profile/trips', title: 'Мои поездки', description: 'Активные и прошлые туры' },
  // { href: '/profile/documents', title: 'Документы', description: 'Паспорт, виза, медполис' },
];

export default function ProfileIndexPage(): React.ReactElement {
  const user = useCurrentUser();

  if (user === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-medium">Личный кабинет</h1>
        <p className="mt-4 text-muted-foreground">
          Войдите чтобы открыть личный кабинет.{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Войти →
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-10 px-6 py-12 sm:py-16">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Личный кабинет
        </p>
        <h1 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          Здравствуйте, {user.email}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Управление вашим профилем и поездками.</p>
      </header>

      <ul className="space-y-3">
        {SECTIONS.map((section) => (
          <li key={section.href}>
            <Link
              href={section.href}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-5 transition hover:border-primary/40"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-medium">{section.title}</h2>
                  {section.badge ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                      {section.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
              </div>
              <span aria-hidden className="shrink-0 text-muted-foreground">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
