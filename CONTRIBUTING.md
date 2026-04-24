# 🤝 Руководство контрибьютора

Спасибо за интерес к IndiaHorizone! Это руководство поможет быстро влиться в процесс разработки.

---

## Содержание

1. [Как начать](#как-начать)
2. [Процесс разработки](#процесс-разработки)
3. [Стандарты кода](#стандарты-кода)
4. [Тестирование](#тестирование)
5. [Pull Requests](#pull-requests)
6. [Issues](#issues)
7. [Кодекс поведения](#кодекс-поведения)

---

## Как начать

### Требования

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker + Docker Compose
- Git

### Настройка окружения

```bash
# 1. Клонировать репозиторий
git clone https://github.com/Rivega42/indiahorizone.git
cd indiahorizone

# 2. Установить зависимости
npm install

# 3. Скопировать конфиг
cp .env.example .env
# Заполнить переменные в .env

# 4. Поднять инфраструктуру
docker compose up -d

# 5. Применить миграции
npm run db:migrate

# 6. Запустить в dev-режиме
npm run dev
```

### Структура репозитория

```
indiahorizone/
├── apps/
│   ├── web/          # Клиентский портал (Next.js)
│   ├── mobile/       # Мобильное приложение (React Native)
│   ├── admin/        # Панель управляющих
│   └── api/          # Backend API (NestJS)
├── packages/
│   ├── ui/           # Общие компоненты
│   ├── core/         # Бизнес-логика
│   ├── notifications/ # Уведомления
│   └── ai/           # AI-интеграции
├── docs/             # Документация и ТЗ
└── scripts/          # Утилиты
```

---

## Процесс разработки

### 1. Выбор задачи

1. Проверьте [Issues](https://github.com/Rivega42/indiahorizone/issues)
2. Метки `good first issue` — хорошая точка входа
3. Оставьте комментарий в issue перед началом работы
4. Нет подходящего issue — создайте новый

### 2. Создание ветки

```bash
# Формат: type/краткое-описание-номер-issue
git checkout -b feature/клиент-оффлайн-режим-12
git checkout -b fix/sos-кнопка-ios-34
git checkout -b docs/tz-ежедневный-фидбэк-56
```

Типы веток:
| Тип | Когда использовать |
|-----|-------------------|
| `feature/` | Новая функциональность |
| `fix/` | Исправление бага |
| `docs/` | Документация |
| `refactor/` | Рефакторинг без изменения поведения |
| `test/` | Добавление тестов |
| `chore/` | Зависимости, конфиги, CI |

### 3. Коммиты

Используем [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(client): добавить оффлайн-кеш trip dashboard
fix(sos): исправить экстренный вызов на iOS 16
docs(tz): обновить ТЗ модуля ежедневного фидбэка
refactor(crm): упростить логику воронки продаж
test(guide): добавить тесты модуля расписания гида
chore(deps): обновить зависимости
```

Структура сообщения:
```
type(scope): краткое описание (до 72 символов)

[опционально] Подробное описание: что и почему изменено.
Ссылки на issue: Closes #12, Relates to #34
```

### 4. Разработка

- Пишите чистый, читаемый код
- Покрывайте логику тестами
- Не забывайте про оффлайн-сценарии (ненадёжный интернет в Индии)
- Проверяйте UI на мобильных устройствах

---

## Стандарты кода

### TypeScript

```typescript
// ✅ Правильно — явные типы, именованный экспорт
export const formatTripDate = (
  date: Date,
  locale: 'ru' | 'en' = 'ru'
): string => {
  return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// ❌ Неправильно — any, var, неявные типы
export function fmt(d) {
  var opts = {};
  return d.toLocaleDateString('ru', opts);
}
```

### React-компоненты

```tsx
// ✅ Правильно
interface FeedbackButtonProps {
  tripId: string;
  dayNumber: number;
  onSubmit: (feedback: DayFeedback) => Promise<void>;
  disabled?: boolean;
}

export const FeedbackButton: FC<FeedbackButtonProps> = ({
  tripId,
  dayNumber,
  onSubmit,
  disabled = false,
}) => {
  return (
    <button
      onClick={() => openFeedbackModal({ tripId, dayNumber, onSubmit })}
      disabled={disabled}
      aria-label={`Оставить отзыв за день ${dayNumber}`}
      className="btn btn--primary"
    >
      Как прошёл день?
    </button>
  );
};
```

### Оффлайн-логика

```typescript
// Всегда проектируй с учётом отсутствия интернета
export const getTripData = async (tripId: string): Promise<Trip> => {
  try {
    const data = await api.getTrip(tripId);
    await cache.set(`trip:${tripId}`, data); // кешируем для оффлайна
    return data;
  } catch (error) {
    if (error instanceof NetworkError) {
      const cached = await cache.get(`trip:${tripId}`);
      if (cached) return cached; // отдаём из кеша
    }
    throw error;
  }
};
```

### API-эндпоинты

```typescript
// Используем REST, понятные имена, русские комментарии в коде
@Get('trips/:id/itinerary')
@Roles('client', 'manager', 'concierge')
async getTripItinerary(@Param('id') tripId: string): Promise<ItineraryDto> {
  return this.tripsService.getItinerary(tripId);
}
```

---

## Тестирование

### Запуск тестов

```bash
npm run test          # Unit-тесты
npm run test:watch    # Watch-режим
npm run test:coverage # Покрытие кода
npm run test:e2e      # E2E тесты
```

### Что тестировать обязательно

- Вся бизнес-логика (расчёты, статусы, переходы)
- API-эндпоинты (happy path + ошибки)
- Оффлайн-сценарии (нет сети → кеш → корректный UI)
- SOS и экстренные функции

### Пример теста

```typescript
describe('FeedbackService', () => {
  it('должен сохранить видео-фидбэк клиента', async () => {
    const feedback = await feedbackService.submit({
      tripId: 'trip-1',
      dayNumber: 3,
      type: 'video',
      content: mockVideoBlob,
    });

    expect(feedback.id).toBeDefined();
    expect(feedback.status).toBe('saved');
  });

  it('должен работать в оффлайн-режиме', async () => {
    networkMock.disable();

    const feedback = await feedbackService.submit({
      tripId: 'trip-1',
      dayNumber: 3,
      type: 'text',
      content: 'Отличный день!',
    });

    expect(feedback.status).toBe('queued'); // сохранён локально, отправится позже
  });
});
```

---

## Pull Requests

### Чеклист перед отправкой PR

- [ ] Код соответствует стандартам проекта
- [ ] Все тесты проходят (`npm run test`)
- [ ] Нет TypeScript-ошибок (`npm run type-check`)
- [ ] Нет ESLint-ошибок (`npm run lint`)
- [ ] Добавлены тесты для новой функциональности
- [ ] Обновлена документация (если нужно)
- [ ] PR связан с issue

### Шаблон описания PR

```markdown
## Что сделано
Краткое описание изменений (1-3 предложения).

## Тип изменений
- [ ] Новая функция
- [ ] Исправление бага
- [ ] Рефакторинг
- [ ] Документация

## Как тестировать
1. Запустить `npm run dev`
2. Открыть /trips/test-trip
3. Нажать «Как прошёл день?»
4. Убедиться, что модал открывается и фидбэк сохраняется

## Связанные issue
Closes #12

## Скриншоты / видео (если есть UI-изменения)
```

### Процесс ревью

1. Открыть PR → автоматически запускаются тесты и линтер
2. Как минимум 1 апрув от команды
3. Все комментарии должны быть разрешены
4. Merge через **Squash and merge** (один коммит в main)

---

## Issues

### Баг-репорт

```markdown
## Описание бага
Краткое описание проблемы.

## Шаги для воспроизведения
1. Открыть приложение
2. Перейти в раздел «Мой маршрут»
3. Отключить интернет
4. Увидеть ошибку вместо оффлайн-данных

## Ожидаемое поведение
Данные должны загружаться из кеша.

## Фактическое поведение
Показывает «Ошибка загрузки», хотя данные были закешированы.

## Окружение
- Платформа: iOS / Android / Web
- Версия приложения: 1.2.3
- Версия ОС: iOS 17

## Дополнительно
Скриншот, логи из консоли.
```

### Запрос новой функции

```markdown
## Что нужно
Описание функции.

## Зачем это нужно
Какую проблему решает. Примеры сценариев использования.

## Для кого
- [ ] Клиент
- [ ] Гид
- [ ] Менеджер
- [ ] Управляющий

## Альтернативы
Какие альтернативные решения рассматривались.
```

---

## Кодекс поведения

- **Уважение:** относимся с уважением ко всем участникам команды
- **Конструктивность:** даём конкретную и полезную обратную связь
- **Честность:** признаём ошибки и учимся на них
- **Фокус на продукт:** споры решаем исходя из пользы для клиента

---

## Связь с командой

- **GitHub Issues:** основной канал для задач и багов
- **GitHub Discussions:** вопросы по архитектуре и продукту

---

*Спасибо, что делаете Индию доступной и понятной для русскоязычных путешественников! 🇮🇳*
