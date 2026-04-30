# Architectural Decision Records (ADR)

> Зачем: сохранить **почему** мы пошли тем или иным путём, чтобы через полгода / при онбординге нового члена команды было понятно — и не пришлось переоткрывать.
>
> Формат: `ADR-NNN <название>` + Status / Context / Decision / Consequences.
> Новый ADR: append в конец файла, увеличить номер на 1. Существующие НЕ редактируем (история — read-only); если решение пересматривается — пишем ADR-NEW который supersedes старый.

---

## ADR-001 Modular monolith → microservices в фазе 4

**Status:** Accepted (2026-04-25)
**Context:** Phase 3 — пилот с малой командой и < 100 клиентов. Микросервисы с самого начала = 4× инфра-overhead без бизнес-выгоды.
**Decision:** Один NestJS deployable со строгими модулями (`apps/api/src/modules/*`), cross-module FK **запрещены** (только soft-references по ID). Это позволит механически вынести модуль в отдельный сервис в фазе 4.
**Consequences:** ✅ Быстрая разработка в phase 3. ⚠️ Дисциплина для cross-module imports — только через bus events или явные `.client.ts` адаптеры. См. `docs/ARCH/MICROSERVICES.md`.

---

## ADR-002 Redis Streams для event bus (не Kafka/NATS)

**Status:** Accepted (2026-04-25)
**Context:** Нужен персистентный event bus для outbox-pattern + audit. Throughput phase 3 — 10s events/sec.
**Decision:** Redis Streams. Уже держим Redis для кеша → нет +1 инфра-зависимости. Throughput phase 3 выдерживает.
**Consequences:** Замена на Kafka/NATS — после 100k events/day, не раньше. Контракты событий не изменятся, только транспорт. См. `docs/ARCH/EVENTS.md`.

---

## ADR-003 Транзакционный outbox + processed_events idempotency

**Status:** Accepted (2026-04-25)
**Context:** Модуль не должен потерять событие при rollback'е транзакции, и не должен обработать его дважды при retry consumer'а.
**Decision:** При записи бизнес-операции в той же транзакции пишем в `outbox_entries`. Outbox-relay воркер публикует в Redis. Subscriber фиксирует `(eventId, consumer)` в `processed_events` после успешной обработки — следующее повторное событие skip'ается.
**Consequences:** ✅ At-least-once → effectively-once. Стандартный паттерн event-driven систем.

---

## ADR-004 Argon2id + 2FA TOTP + suspicious-login detector для auth

**Status:** Accepted (2026-04-26)
**Context:** Ставим travel-сервис под РФ-аудиторию с PII (паспорт). 152-ФЗ + GDPR-подобные требования.
**Decision:**
- Пароли через **argon2id** (memoryCost 19456, timeCost 2, parallelism 1).
- 2FA TOTP (otplib) + recovery-codes (argon2-хеш).
- JWT access (15 мин) + refresh (30 дней) с rotation.
- Reuse-detect на refresh + новая страна по IP → suspicious-session event.
**Consequences:** Дороже register/login (~250ms argon2 hash), но защита от credential stuffing. Без 2FA не запускаем legal-significant features (SOS).

---

## ADR-005 AES-256-GCM column-level encryption для PII

**Status:** Accepted (2026-04-27)
**Context:** 152-ФЗ — PII (firstName, lastName, dateOfBirth, phone, паспорт) хранятся в БД. Утечка БД через SQL-injection / backup leak — приведёт к штрафам и репутационному ущербу.
**Decision:** Column-level AES-256-GCM шифрование чувствительных полей в `client_profiles` через `CryptoService`. Master-key в env (`ENCRYPTION_MASTER_KEY`), в production — Vault. Ротация ключа — отдельный issue фазы 4 (key versioning + re-encrypt worker).
**Consequences:** ✅ Утечка БД ≠ утечка PII. ⚠️ Slight overhead на каждом read/write, но Postgres не индексирует encrypted-поля → поиск по phone требует hash-индекса (не реализовано в phase 3 — поиск only по userId).

---

## ADR-006 Web Push (W3C) — без Firebase / APNs

**Status:** Accepted (2026-04-29)
**Context:** Push-нотификации для trip status / SOS. Изначально планировали Firebase + APNs.
**Decision:** Используем W3C Web Push standard через `web-push` npm с VAPID-keypair. Браузеры (Chrome → FCM, Firefox → Mozilla autopush, Safari iOS PWA → Apple-push) сами роутят. **Без Firebase project, без Apple Developer subscription**.
**Consequences:** ✅ Покрывает 100% web-аудитории в фазе 3 (включая iOS PWA через standalone-режим). ⚠️ Native iOS/Android приложения (фаза 4) потребуют APNs/FCM-v1 separately. См. PR #376, #163.

---

## ADR-007 Tour catalog — JSON seed → Admin UI в фазе 4

**Status:** Accepted (2026-04-29)
**Context:** На запуске 10-15 туров. Founder (Roman) пишет контент.
**Decision:** Phase 3 — туры в `apps/api/prisma/seed/tours/<slug>.json` с auto-discovery. Editing через PR. Phase 4 (#311) — Admin Panel для редактирования без re-deploy.
**Consequences:** ✅ Все изменения каталога идут через code-review + git history (audit-trail). ⚠️ Founder не может править контент без PR — ускоряем когда появится Admin UI.

---

## ADR-008 Branch strategy — feature-branch + squash-merge

**Status:** Accepted (2026-04-29, сформулировано из практики)
**Context:** Несколько контекстов работы (Claude, Roman, Vika) → нужен чёткий branch flow.
**Decision:**
- Ветки: `feature/<name>`, `fix/<name>`, `docs/<name>`, `chore/<name>`, `claude/<topic>` (для AI sessions).
- Запрещены: force-push в `main`, `--no-verify`, удаление веток без подтверждения.
- Merge: **squash** (один PR = один коммит в `main`). Conventional Commits для commit-messages.
- Rebase для multi-step PR'ов когда есть конфликты — `--force-with-lease` only.
**Consequences:** ✅ Чистая история main без merge-коммитов. ✅ Любой PR можно revert одним коммитом.

---

## ADR-009 GitHub Project v2 + sub-issues — единый source of truth

**Status:** Accepted (2026-04-29)
**Context:** Issues / sub-issues / milestones / project-board — несколько мест где можно фиксировать состояние.
**Decision:** **GitHub Project v2** (https://github.com/users/Rivega42/projects/3) — единый источник правды о Status / Priority / Sprint. Sub-issues API для иерархии epic→issue→sub-issue. Milestones — для батчей релизов. Лейблы — ярлыки совместимости.
**Consequences:** ✅ Один dashboard, можно автоматизировать через GraphQL. ⚠️ Зависимость от GitHub — при миграции на GitLab/self-hosted нужен export-tool (не делаем в phase 3).

---

## ADR-010 Repo-setup-kit для автоматизации (этот PR)

**Status:** Accepted (2026-04-29)
**Context:** Manual labelling, ручной rollup эпиков по sub-issues, отсутствие weekly digest. Не масштабируется при росте.
**Decision:** Применяем `repo-setup-kit`: 8+ workflow-ов автоматизации, automation scripts (auto-labels, rollup, epic-sync, deps, validate, digest, notify), ISSUE_TEMPLATE'ы (epic, task, tech_debt, vika_devops). Интегрируем СВЕРХУ существующих workflow'ов (не заменяем `ci.yml`, `prisma-check.yml`, `lighthouse.yml`).
**Consequences:** ✅ Automatic sub-issue rollup, dependency resolver, weekly digest, validate-issue check. ⚠️ Нужны secrets `PROJECT_TOKEN` (PAT) + `TELEGRAM_BOT_TOKEN` для notify — issues для Vика. См. `chore/repo-setup` PR.
