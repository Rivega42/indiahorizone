import { ConsentType } from '@prisma/client';

/**
 * Текущие версии текстов согласий из docs/LEGAL/CONSENTS/.
 *
 * Используются как snapshot при создании Consent-записи (#142).
 * При обновлении шаблона текста в docs/LEGAL/CONSENTS/<file>.md — инкрементируется
 * версия здесь. Существующие Consent-записи сохраняют свою старую версию (audit
 * для 152-ФЗ ст. 14: при споре с Роскомнадзором / клиентом мы должны показать
 * какой именно текст подписал клиент).
 *
 * Формат версии: '<YYYY-MM-DD>-v<N>'. N инкрементируется в рамках одного дня.
 *
 * рекомендация: не превращать это в БД-таблицу до тех пор пока не нужно
 * программное управление версиями (например через админку #323). Сейчас тексты
 * правит юрист в Markdown, разработчик инкрементирует константу — простота.
 */
export const CURRENT_CONSENT_VERSIONS: Readonly<Record<ConsentType, string>> = {
  pdn: '2026-04-25-v1',
  photo_video: '2026-04-25-v1',
  geo: '2026-04-25-v1',
  emergency_contacts: '2026-04-25-v1',
} as const;

/**
 * Mapping consent_type → markdown source. Используется в будущих endpoints
 * (GET /consents/:type/text), чтобы клиент в ЛК мог посмотреть текущий текст.
 */
export const CONSENT_DOC_PATHS: Readonly<Record<ConsentType, string>> = {
  pdn: 'docs/LEGAL/CONSENTS/PDN.md',
  photo_video: 'docs/LEGAL/CONSENTS/PHOTO_VIDEO.md',
  geo: 'docs/LEGAL/CONSENTS/GEO.md',
  emergency_contacts: 'docs/LEGAL/CONSENTS/EMERGENCY_CONTACTS.md',
} as const;
