'use client';

import { useState } from 'react';

import { LeadApiError, submitLead } from '@/lib/api/leads';

type ContactType = 'phone' | 'telegram' | 'email';

type FormState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

const CONSENT_TEXT_VERSION = '2026-04-27-v1';

export function LeadForm({ tourSlug }: { tourSlug: string }): React.ReactElement {
  const [name, setName] = useState('');
  const [contactType, setContactType] = useState<ContactType>('telegram');
  const [contact, setContact] = useState('');
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<FormState>({ kind: 'idle' });

  const canSubmit =
    consent &&
    name.trim().length >= 2 &&
    contact.trim().length >= 3 &&
    state.kind !== 'submitting';

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!canSubmit) return;
    setState({ kind: 'submitting' });

    const payload = {
      source: `tour-${tourSlug}`,
      name: name.trim(),
      contactType,
      contact: contact.trim(),
      ...(comment.trim().length > 0 ? { comment: comment.trim() } : {}),
      consent,
      consentTextVersion: CONSENT_TEXT_VERSION,
    };

    try {
      await submitLead(payload);
      setState({ kind: 'success' });
    } catch (err) {
      const message =
        err instanceof LeadApiError
          ? err.message
          : 'Не удалось отправить заявку. Напишите нам в Telegram.';
      setState({ kind: 'error', message });
    }
  }

  if (state.kind === 'success') {
    return (
      <div className="space-y-3 text-center">
        <div className="text-2xl">✓</div>
        <h3 className="font-serif text-2xl">Заявка отправлена</h3>
        <p className="text-sm text-background/70">
          Мы напишем вам в течение 2 часов в выбранном канале.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { void onSubmit(e); }} className="space-y-4">
      <div className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
        Заявка на тур
      </div>
      <h3 className="font-serif text-2xl font-medium">Хочу этот тур</h3>

      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-wide text-background/60">
          Как к вам обращаться
        </span>
        <input
          type="text"
          required
          minLength={2}
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя"
          className="w-full rounded-md border border-background/20 bg-background/10 px-3 py-2.5 text-sm text-background placeholder:text-background/40 focus:border-primary focus:outline-none"
        />
      </label>

      <div>
        <span className="mb-1.5 block text-xs uppercase tracking-wide text-background/60">
          Удобный канал связи
        </span>
        <div className="flex gap-2">
          {(['telegram', 'phone', 'email'] as ContactType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setContactType(t)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
                contactType === t
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-background/20 bg-background/10 text-background hover:bg-background/20'
              }`}
            >
              {t === 'telegram' ? 'Telegram' : t === 'phone' ? 'Телефон' : 'Email'}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <input
          type={contactType === 'email' ? 'email' : 'text'}
          inputMode={contactType === 'phone' ? 'tel' : 'text'}
          required
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={
            contactType === 'telegram'
              ? '@username'
              : contactType === 'phone'
                ? '+7 999 000 00 00'
                : 'you@example.com'
          }
          className="w-full rounded-md border border-background/20 bg-background/10 px-3 py-2.5 text-sm text-background placeholder:text-background/40 focus:border-primary focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-wide text-background/60">
          Комментарий (необязательно)
        </span>
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Когда удобно позвонить, какие предпочтения и т.д."
          className="w-full rounded-md border border-background/20 bg-background/10 px-3 py-2.5 text-sm text-background placeholder:text-background/40 focus:border-primary focus:outline-none"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-background/20 bg-background/10 p-3 text-xs leading-relaxed">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
          required
        />
        <span className="text-background/80">
          Согласен(на) с обработкой персональных данных в соответствии с{' '}
          <a href="/privacy" className="underline hover:text-primary">
            Политикой конфиденциальности
          </a>
          . Передача данных партнёру в Индии — для организации поездки.
        </span>
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state.kind === 'submitting' ? 'Отправка…' : 'Отправить заявку'}
      </button>

      {state.kind === 'error' && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          {state.message}
        </div>
      )}

      <p className="text-center text-xs text-background/50">
        Ответ менеджера в течение 2 часов · без спама
      </p>
    </form>
  );
}
