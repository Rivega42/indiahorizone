# Slice I — Finance baseline

> Goal: «Менеджер выставляет инвойс. Клиент видит ссылку, оплачивает (карта/СБП). Платёж фиксируется, trip переходит в paid. AML базовый, возвраты — manual в фазе 3».
> Покрывает [`USER_STORIES.md` US-CL-2](../../USER_STORIES.md), [`docs/FINANCE/PAYMENTS/SCHEME.md`](../../FINANCE/PAYMENTS/SCHEME.md), [`AML.md`](../../FINANCE/PAYMENTS/AML.md), [`REFUNDS.md`](../../FINANCE/REFUNDS.md).

> **Рекомендация (опыт):** в фазе 3 НЕ интегрируем сложный платёжный шлюз с auto-reconciliation. Делаем «invoice → ссылка/реквизиты → ручная отметка оплаты» + параллельно лёгкая интеграция с одним эквайером. **Почему:** первые 50–100 платежей дают данные о реальных edge-cases (отказ банка, частичная оплата, валютные расхождения), которые невозможно предусмотреть на старте. Минимальная автоматика → минимальные баги.

## IH-M5-I-001 — feat(finance): модели Invoice + Payment + Refund

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** D-001
- **Acceptance:**
  - [ ] `Invoice` (id, tripId, amount, currency, status: draft|sent|paid|cancelled|refunded, dueAt, paidAt nullable, externalId nullable)
  - [ ] `Payment` (id, invoiceId, amount, currency, method enum: card|sbp|wire|other, status, externalId, paidAt, fxRate)
  - [ ] `Refund` (id, paymentId, amount, reason, status, processedAt)
  - [ ] `InvoiceItem` (id, invoiceId, kind, description, amount)
- **Files:** `apps/api/src/modules/finance/*`, миграция
- **Labels:** `area:finance`, `slice:I`, `priority:p0`, `type:feat`

## IH-M5-I-002 — feat(finance): создание и отправка инвойса

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** I-001
- **Acceptance:**
  - [ ] `POST /finance/invoices` — manager создаёт draft
  - [ ] `POST /finance/invoices/:id/send` — публичная ссылка для клиента, статус `sent`
  - [ ] PDF-инвойс генерируется (puppeteer или PDFKit)
  - [ ] Реквизиты РФ юрлица из конфига
  - [ ] Публикует `finance.invoice.issued`
  - [ ] comm-svc отправляет email клиенту с ссылкой и PDF-attachment
- **Files:** `apps/api/src/modules/finance/invoice.service.ts`, шаблон PDF
- **Labels:** `area:finance`, `slice:I`, `priority:p0`, `type:feat`

## IH-M5-I-003 — feat(finance): payment intent (эквайринг — заглушка)

- **Type:** feat — **Estimate:** 6h — **Owner:** backend — **Deps:** I-002
- **Acceptance:**
  - [ ] `POST /finance/invoices/:id/pay` принимает `{method}` → возвращает `{paymentUrl, paymentId}`
  - [ ] Адаптер `PaymentProvider` interface (для будущих: ЮKassa, Tinkoff, СБПay)
  - [ ] В фазе 3 — **stub-провайдер** возвращает реквизиты для wire-перевода + ссылку на ручное подтверждение
  - [ ] Webhook endpoint `POST /finance/payments/webhook/:provider` для будущей интеграции
- **Files:** `apps/api/src/modules/finance/providers/*`
- **Labels:** `area:finance`, `slice:I`, `priority:p0`, `type:feat`

## IH-M5-I-004 — feat(finance): manual payment confirmation

- **Type:** feat — **Estimate:** 3h — **Owner:** backend — **Deps:** I-003
- **Acceptance:**
  - [ ] `POST /finance/invoices/:id/confirm-payment` (только finance|admin)
  - [ ] Принимает `{externalId, paidAt, fxRate?}` → создаёт Payment в статусе `paid`
  - [ ] Меняет invoice status на `paid`
  - [ ] Публикует `finance.payment.received` (trips-svc слушает → trip → paid)
  - [ ] Audit-log включает прикреплённое подтверждение (банк-выписка как media)
- **Files:** `apps/api/src/modules/finance/manual-confirm.service.ts`
- **Labels:** `area:finance`, `slice:I`, `priority:p0`, `type:feat`

## IH-M5-I-005 — feat(finance): AML базовая проверка

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** C-002, I-001
- **Acceptance:**
  - [ ] `POST /finance/aml/check` (внутр.) — проверяет клиента перед invoice.send
  - [ ] Правила: возраст ≥ 18, сумма ≥ 600k ₽ → flag для ручной проверки (115-ФЗ); страны санкций; double-name match
  - [ ] При flag → invoice не уходит, событие `finance.aml.flagged`
  - [ ] Concierge/admin получает в админке экран AML-review
- **Files:** `apps/api/src/modules/finance/aml/*`
- **Labels:** `area:finance`, `slice:I`, `priority:p0`, `type:feat`
- **Notes:** Соответствует [`docs/FINANCE/PAYMENTS/AML.md`](../../FINANCE/PAYMENTS/AML.md). Полная KYC — фаза 4 (после 100+ клиентов).

## IH-M5-I-006 — feat(finance): inter-co transfer учёт

- **Type:** feat — **Estimate:** 5h — **Owner:** backend — **Deps:** I-001
- **Acceptance:**
  - [ ] `IntercoTransfer` (id, tripId, amountRub, amountInr, fxRate, sentAt, confirmedAt nullable, bankRef)
  - [ ] `POST /finance/interco/transfer` фиксирует факт перевода РФ → IN
  - [ ] Связь с invoice/payment
  - [ ] Отчёт: `GET /finance/interco/report?from=...&to=...`
- **Files:** `apps/api/src/modules/finance/interco/*`
- **Labels:** `area:finance`, `slice:I`, `priority:p1`, `type:feat`
- **Notes:** См. [`docs/FINANCE/CONTRACT_INTERCO.md`](../../FINANCE/CONTRACT_INTERCO.md), [`CURRENCY_CONTROL.md`](../../FINANCE/PAYMENTS/CURRENCY_CONTROL.md).

## IH-M5-I-007 — feat(finance): refund manual

- **Type:** feat — **Estimate:** 4h — **Owner:** backend — **Deps:** I-001
- **Acceptance:**
  - [ ] `POST /finance/refunds` (только admin) — создаёт Refund
  - [ ] Расчёт суммы по сетке из [`REFUNDS.md`](../../FINANCE/REFUNDS.md) (но финальная сумма — за admin)
  - [ ] Статусы: pending|sent|completed|failed
  - [ ] Публикует `finance.refund.processed`
  - [ ] Связан с trip — может triggerить `trips.cancelled`
- **Files:** `apps/api/src/modules/finance/refund.service.ts`
- **Labels:** `area:finance`, `slice:I`, `priority:p1`, `type:feat`

## IH-M5-I-008 — feat(web): экран оплаты для клиента

- **Type:** feat — **Estimate:** 5h — **Owner:** frontend — **Deps:** I-003
- **Acceptance:**
  - [ ] `/invoices/:id` (публичная страница, доступна по signed link)
  - [ ] Показывает: trip summary, items, итог, реквизиты, способы оплаты
  - [ ] Кнопка «оплатить картой/СБП» (заглушка в фазе 3)
  - [ ] После оплаты — экран «спасибо, проверим в течение N часов»
- **Files:** `apps/web/app/invoices/[id]/page.tsx`
- **Labels:** `area:web`, `slice:I`, `priority:p0`, `type:feat`

## IH-M5-I-009 — test(finance): e2e инвойс + платёж

- **Type:** test — **Estimate:** 4h — **Owner:** qa — **Deps:** I-008
- **Acceptance:**
  - [ ] Сценарий: manager создаёт invoice → клиент получает email → открывает страницу → видит реквизиты
  - [ ] Сценарий: admin отмечает «оплачено» → trip переходит в `paid`
  - [ ] Сценарий: AML flag → invoice не отправляется, admin видит alert
  - [ ] Сценарий: refund → trip cancelled, refund в pending
- **Files:** `apps/web/tests/finance.spec.ts`
- **Labels:** `area:finance`, `slice:I`, `priority:p0`, `type:test`

## Slice I — итог

9 issues, ≈ 41 час.

**DoD:** инвойс выставляется и отправляется, клиент видит, оплачивает (manual confirm в фазе 3), AML базовый, refund manual, inter-co учёт.
