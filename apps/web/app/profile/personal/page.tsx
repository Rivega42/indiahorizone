'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { getMe, updateMe, type ClientMe, type UpdateClientProfilePatch } from '@/lib/api/clients';
import { useCurrentUser } from '@/lib/auth/store';

/**
 * /profile/personal — редактирование PII (#A-02).
 *
 * - Pre-fill из GET /clients/me.
 * - PII (телефон, дата рождения) показаны masked, toggle «Показать».
 * - Submit отправляет diff-only patch через PATCH /clients/me.
 * - Backend шифрует firstName/lastName/dateOfBirth/phone через AES-256-GCM.
 */

const E164_PATTERN = /^\+\d{10,15}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_COUNTRY_PATTERN = /^[A-Z]{2}$/;
const TG_HANDLE_PATTERN = /^[A-Za-z0-9_]{5,32}$/;

interface FormState {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  citizenship: string;
  phone: string;
  telegramHandle: string;
}

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  citizenship: '',
  phone: '',
  telegramHandle: '',
};

function fromProfile(me: ClientMe | null): FormState {
  const p = me?.profile;
  if (!p) return EMPTY_FORM;
  return {
    firstName: p.firstName ?? '',
    lastName: p.lastName ?? '',
    dateOfBirth: p.dateOfBirth ?? '',
    citizenship: p.citizenship ?? '',
    phone: p.phone ?? '',
    telegramHandle: p.telegramHandle ?? '',
  };
}

function maskPhone(phone: string): string {
  // +79161234512 → +7 *** *** ** 12
  if (!E164_PATTERN.test(phone)) return phone;
  const last = phone.slice(-2);
  const cc = phone.slice(0, 2);
  return `${cc} *** *** ** ${last}`;
}

function maskDate(date: string): string {
  // 1990-06-15 → **.**.1990
  if (!ISO_DATE_PATTERN.test(date)) return date;
  return `**.**.${date.slice(0, 4)}`;
}

function diffPatch(initial: FormState, current: FormState): UpdateClientProfilePatch {
  const patch: UpdateClientProfilePatch = {};
  const fields: (keyof FormState)[] = [
    'firstName',
    'lastName',
    'dateOfBirth',
    'citizenship',
    'phone',
    'telegramHandle',
  ];
  for (const f of fields) {
    if (initial[f] !== current[f]) {
      // Пустая строка → null (очистить поле)
      patch[f] = current[f] === '' ? null : current[f];
    }
  }
  return patch;
}

function validate(form: FormState): string | null {
  if (form.phone && !E164_PATTERN.test(form.phone)) {
    return 'Телефон в формате +<код страны><номер>, например +79161234567.';
  }
  if (form.dateOfBirth && !ISO_DATE_PATTERN.test(form.dateOfBirth)) {
    return 'Дата рождения в формате YYYY-MM-DD.';
  }
  if (form.citizenship && !ISO_COUNTRY_PATTERN.test(form.citizenship)) {
    return 'Гражданство — 2 буквы в верхнем регистре (RU, IN, ...).';
  }
  if (form.telegramHandle && !TG_HANDLE_PATTERN.test(form.telegramHandle)) {
    return 'Telegram: 5–32 латинских/цифр/подчёркивания, без @.';
  }
  return null;
}

export default function PersonalProfilePage(): React.ReactElement {
  const user = useCurrentUser();
  const [initial, setInitial] = useState<FormState>(EMPTY_FORM);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState(false);
  const [showDob, setShowDob] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getMe()
      .then((data) => {
        if (cancelled) return;
        const initialForm = fromProfile(data);
        setInitial(initialForm);
        setForm(initialForm);
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить профиль.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const patch = useMemo(() => diffPatch(initial, form), [initial, form]);
  const hasChanges = Object.keys(patch).length > 0;

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!hasChanges) return;
    setSubmitting(true);
    setError(null);
    setToast(null);
    try {
      await updateMe(patch);
      setInitial(form); // diff обнулится
      setToast('Сохранено');
      setTimeout(() => setToast(null), 3000);
    } catch {
      setError('Не удалось сохранить. Проверьте данные и попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  }

  if (user === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-medium">Личные данные</h1>
        <p className="mt-4 text-muted-foreground">
          Войдите чтобы редактировать профиль.{' '}
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
          Личные данные
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ФИО, дата рождения, телефон. Конфиденциальные поля шифруются на сервере (AES-256-GCM).
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium">Имя</span>
            <input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              maxLength={100}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Анна"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Фамилия</span>
            <input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              maxLength={100}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Петрова"
            />
          </label>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Дата рождения</span>
              {form.dateOfBirth ? (
                <button
                  type="button"
                  onClick={() => setShowDob((v) => !v)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {showDob ? 'Скрыть' : 'Показать'}
                </button>
              ) : null}
            </div>
            <input
              type="date"
              value={showDob ? form.dateOfBirth : ''}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              onFocus={() => setShowDob(true)}
              placeholder={form.dateOfBirth ? maskDate(form.dateOfBirth) : '1990-06-15'}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            {!showDob && form.dateOfBirth ? (
              <p className="mt-1 text-xs text-muted-foreground">{maskDate(form.dateOfBirth)}</p>
            ) : null}
          </div>

          <label className="block">
            <span className="text-sm font-medium">Гражданство</span>
            <input
              value={form.citizenship}
              onChange={(e) =>
                setForm({ ...form, citizenship: e.target.value.toUpperCase().slice(0, 2) })
              }
              placeholder="RU"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm uppercase"
              maxLength={2}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              ISO 3166-1 alpha-2: RU, IN, US, GB.
            </p>
          </label>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Телефон</span>
              {form.phone ? (
                <button
                  type="button"
                  onClick={() => setShowPhone((v) => !v)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {showPhone ? 'Скрыть' : 'Показать'}
                </button>
              ) : null}
            </div>
            <input
              value={showPhone ? form.phone : maskPhone(form.phone)}
              onChange={(e) => {
                setShowPhone(true);
                setForm({ ...form, phone: e.target.value });
              }}
              onFocus={() => setShowPhone(true)}
              placeholder="+79161234567"
              inputMode="tel"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">E.164 формат: + и 10–15 цифр.</p>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Telegram</span>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <input
                value={form.telegramHandle}
                onChange={(e) => setForm({ ...form, telegramHandle: e.target.value })}
                placeholder="username"
                className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm"
                maxLength={32}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">5–32 символа, латиница/цифры/_</p>
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {toast ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{toast}</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!hasChanges || submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
