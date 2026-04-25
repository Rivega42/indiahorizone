# Security: secret management

> Закрывает [#69](https://github.com/Rivega42/indiahorizone/issues/69). Часть EPIC 6 [#57](https://github.com/Rivega42/indiahorizone/issues/57).
> Статус: Draft v0.1.

## Принципы

1. **Никаких секретов в `.env` на проде.** `.env` — только локальная разработка.
2. **Никаких секретов в git** (включая зашифрованные — `.env.enc`, sealed-secrets и т.п. — это всё равно цель атаки).
3. **Доступ по принципу least privilege** — каждый сервис видит только нужные ему секреты.
4. **Ротация по графику** + при инцидентах.
5. **Audit-log** всех чтений и изменений.

## Выбор хранилища

### Yandex Cloud Lockbox (рекомендация для фазы 3)

**Плюсы:**
- В РФ-облаке, соответствует 152-ФЗ
- Интеграция с YC IAM (роль для каждого сервиса)
- Версионирование секретов
- Audit-log в YC Audit Trails

**Минусы:**
- Привязка к YC (vendor lock-in)
- Стоимость: невысокая (~₽40 за секрет/мес)

### Альтернативы

- **HashiCorp Vault** — open source, on-prem или Vault Enterprise. Сложнее в настройке, но независим.
- **Doppler** — SaaS, простой, но не в РФ.
- **AWS Secrets Manager** — недоступен / в санкциях.

**Решение:** YC Lockbox для фазы 3, миграция на Vault при фазе 5+ или росте требований.

## Структура секретов

```
indiahorizone/
├── prod/
│   ├── identity-svc/
│   │   ├── jwt-secret
│   │   └── jwt-refresh-secret
│   ├── clients-svc/
│   │   └── db-password
│   ├── finance-svc/
│   │   ├── db-password
│   │   ├── payment-shop-id
│   │   └── payment-api-key
│   ├── sos-svc/
│   │   ├── db-password
│   │   ├── twilio-auth-token
│   │   └── telegram-bot-token
│   ├── media-svc/
│   │   ├── s3-access-key
│   │   └── s3-secret-key
│   └── ai-svc/
│       └── openai-api-key
├── staging/
│   └── ...
```

Каждый секрет имеет:
- Имя (читаемое)
- Значение (зашифровано)
- Версию (новая версия = ротация)
- TTL (для авто-уведомления о ротации)
- Список IAM-ролей с доступом

## Доступ из сервиса

Сервис при старте (через init-контейнер или sidecar):

```yaml
# Kubernetes deployment example
spec:
  containers:
    - name: sos-svc
      image: ih/sos-svc:v1.2.3
      env:
        - name: TWILIO_AUTH_TOKEN
          valueFrom:
            secretKeyRef:
              name: sos-svc-twilio
              key: token
```

Где `secret` — синхронизирован из YC Lockbox через [External Secrets Operator](https://external-secrets.io/) или [VaultWarden бэк](https://github.com/yandex-cloud/k8s-csi-s3) (зависит от выбранного оркестратора).

## Ротация

| Секрет | Период | Триггер на досрочную ротацию |
|---|---|---|
| JWT secret | 90 дней | Утечка / увольнение разработчика |
| DB password | 90 дней | Подозрение на компрометацию |
| API ключи (Twilio, OpenAI) | 180 дней | Те же |
| S3 keys | 90 дней | Те же |

Процесс ротации (на примере JWT secret):

1. Создаём новую версию секрета в Lockbox
2. Сервис `identity-svc` поддерживает **два секрета одновременно** (старый — для верификации, новый — для подписи)
3. Через 24 часа (срок жизни access-токена) — переключаемся: старый только для верификации
4. Через 30 дней (срок жизни refresh-токена) — старый секрет удаляется

Никакого простоя, никаких разлогинов клиентов.

## Аудит доступа

YC Audit Trails / Vault Audit включены. Лог: кто, когда, какой секрет читал.

В `audit-svc` копия — хранится 3 года.

Тревога:
- Доступ к секрету из IP вне нашего VPC
- Чтение секрета сервисом, у которого роль не предполагает этот секрет
- Аномальная частота чтений

## Acceptance criteria (#69)

- [x] Файл существует
- [x] Выбор хранилища (YC Lockbox) обоснован
- [x] Регламент ротации (по типам секретов, процесс)
- [x] Audit-log включен
