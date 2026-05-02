'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  deleteContact,
  listContacts,
  upsertContact,
  type EmergencyContact,
  type EmergencyContactPriority,
} from '@/lib/api/emergency';
import { useCurrentUser } from '@/lib/auth/store';

/**
 * /profile/emergency — экстренные контакты (#A-07).
 *
 * Список 1-2 контактов (primary/secondary) с CRUD.
 * PII (имя/телефон) шифруются на бэке через AES-256-GCM.
 *
 * Лимит 2 контакта enforced backend'ом (uniqueness по priority).
 */

const PRIORITY_LABEL: Record<EmergencyContactPriority, string> = {
  primary: 'Первый контакт',
  secondary: 'Второй контакт',
};

const E164_PATTERN = /^\+\d{10,15}$/;
const LANGUAGE_PATTERN = /^[a-z]{2}$/;

interface FormState {
  priority: EmergencyContactPriority;
  name: string;
  phone: string;
  relation: string;
  language: string;
}

function emptyForm(priority: EmergencyContactPriority): FormState {
  return { priority, name: '', phone: '', relation: '', language: 'ru' };
}

function validate(form: FormState): string | null {
  if (form.name.trim().length < 2) return 'Имя минимум 2 символа.';
  if (!E164_PATTERN.test(form.phone)) {
    return 'Телефон в формате +<код страны><номер>, 11–16 цифр (например +79161234567).';
  }
  if (form.relation.trim().length < 1) return 'Укажите кем приходится контакт.';
  if (!LANGUAGE_PATTERN.test(form.language)) {
    return 'Язык — 2 буквы lowercase (ru, en).';
  }
  return null;
}

export default function EmergencyContactsPage(): React.ReactElement {
  const user = useCurrentUser();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    listContacts()
      .then((data) => {
        if (!cancelled) setContacts(data);
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить контакты.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSubmit(): Promise<void> {
    if (!editing) return;
    const validationError = validate(editing);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setError(null);
    try {
      const saved = await upsertContact({
        priority: editing.priority,
        name: editing.name.trim(),
        phone: editing.phone.trim(),
        relation: editing.relation.trim(),
        language: editing.language.trim(),
      });
      setContacts((prev) => {
        const filtered = prev.filter((c) => c.priority !== saved.priority);
        return [...filtered, saved].sort((a, b) =>
          a.priority === 'primary' ? -1 : b.priority === 'primary' ? 1 : 0,
        );
      });
      setEditing(null);
    } catch {
      setError('Не удалось сохранить контакт. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setError(null);
    try {
      await deleteContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError('Не удалось удалить контакт.');
    }
  }

  function startEdit(priority: EmergencyContactPriority): void {
    const existing = contacts.find((c) => c.priority === priority);
    if (existing) {
      setEditing({
        priority,
        name: existing.name,
        phone: existing.phone,
        relation: existing.relation,
        language: existing.language,
      });
    } else {
      setEditing(emptyForm(priority));
    }
    setFormError(null);
  }

  if (user === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl font-medium">Экстренные контакты</h1>
        <p className="mt-4 text-muted-foreground">
          Войдите чтобы добавить экстренные контакты.{' '}
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
          Экстренные контакты
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          1–2 человека, с которыми мы свяжемся при ЧП во время вашей поездки. Данные шифруются.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <div className="space-y-3">
          {(['primary', 'secondary'] as EmergencyContactPriority[]).map((priority) => {
            const contact = contacts.find((c) => c.priority === priority);
            return (
              <div key={priority} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      {PRIORITY_LABEL[priority]}
                    </p>
                    {contact ? (
                      <>
                        <p className="mt-1 font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contact.phone} · {contact.relation} · {contact.language}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">Не указан</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(priority)}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
                    >
                      {contact ? 'Изменить' : 'Добавить'}
                    </button>
                    {contact ? (
                      <button
                        type="button"
                        onClick={() => void handleDelete(contact.id)}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                      >
                        Удалить
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {editing ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-title"
        >
          <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 shadow-lg">
            <h3 id="edit-title" className="font-medium">
              {PRIORITY_LABEL[editing.priority]}
            </h3>

            <label className="block">
              <span className="text-sm">Имя</span>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Анна Петрова"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                maxLength={100}
              />
            </label>

            <label className="block">
              <span className="text-sm">Телефон</span>
              <input
                value={editing.phone}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                placeholder="+79161234567"
                inputMode="tel"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-sm">Кем приходится</span>
              <input
                value={editing.relation}
                onChange={(e) => setEditing({ ...editing, relation: e.target.value })}
                placeholder="Жена / Отец / Друг"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                maxLength={50}
              />
            </label>

            <label className="block">
              <span className="text-sm">Язык общения</span>
              <select
                value={editing.language}
                onChange={(e) => setEditing({ ...editing, language: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="ru">ru — русский</option>
                <option value="en">en — английский</option>
              </select>
            </label>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={submitting}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
