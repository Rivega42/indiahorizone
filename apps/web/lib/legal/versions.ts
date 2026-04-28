/**
 * Версии юридических документов (#307).
 *
 * Source-of-truth для:
 * - apps/web/app/(legal)/consent/page.tsx (отображает версию пользователю)
 * - apps/web/app/(legal)/privacy/page.tsx (отображает версию)
 * - apps/web/app/tours/[slug]/lead-form.tsx (отправляет на API в Lead.consentTextVersion)
 *
 * При каждом редактировании текста /consent или /privacy — bump версии здесь.
 * Backend сохраняет именно эту строку — она и есть юр. доказательство какая
 * редакция была активна на момент согласия.
 *
 * Формат: SemVer-like (`major.minor.patch`):
 * - patch — типографские правки, не меняющие смысл
 * - minor — изменение содержания одного блока
 * - major — структурная переработка (сменился operator, добавилась/убрана категория данных)
 */

export const CONSENT_VERSION = '0.1.0';
export const PRIVACY_VERSION = '0.1.0';

export const LEGAL_LAST_UPDATED = '28 апреля 2026 г.';
