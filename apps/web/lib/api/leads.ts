/**
 * Leads API client — отправка заявок на backend (#297).
 *
 * Используется в `<LeadForm/>` на странице тура. Browser-side fetch.
 *
 * Server-side validation — на API:
 * - consent === true (иначе 400)
 * - rate-limit 5/мин на IP (иначе 429)
 *
 * Issue: backend integration phase EPIC 12.
 */

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? '';

export interface CreateLeadPayload {
  source: string;
  name: string;
  contactType: 'phone' | 'telegram' | 'email';
  contact: string;
  comment?: string;
  consent: boolean;
  consentTextVersion: string;
}

export interface CreateLeadResult {
  id: string;
}

export class LeadApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: 'rate_limit' | 'validation' | 'server' | 'network',
  ) {
    super(message);
    this.name = 'LeadApiError';
  }
}

export async function submitLead(payload: CreateLeadPayload): Promise<CreateLeadResult> {
  if (API_URL.length === 0) {
    throw new LeadApiError('API недоступен', 0, 'network');
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new LeadApiError('Не удалось связаться с сервером. Попробуйте Telegram.', 0, 'network');
  }

  if (res.status === 429) {
    throw new LeadApiError(
      'Слишком много заявок с этого устройства. Попробуйте через минуту.',
      429,
      'rate_limit',
    );
  }
  if (res.status === 400) {
    let msg = 'Проверьте корректность данных.';
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === 'string' && body.message.length > 0) msg = body.message;
    } catch {
      /* ignore parse */
    }
    throw new LeadApiError(msg, 400, 'validation');
  }
  if (!res.ok) {
    throw new LeadApiError('Что-то пошло не так. Напишите нам в Telegram.', res.status, 'server');
  }

  const result = (await res.json()) as CreateLeadResult;
  return result;
}
