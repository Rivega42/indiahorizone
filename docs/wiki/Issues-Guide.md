# 📋 Как работать с Issues

## Структура заголовка

```
[M{milestone}.{epic}.{num}] [P{priority}] {type}({scope}): {описание}
```

Примеры:
- `[M5.A.1] [P0] feat(monorepo): pnpm workspaces setup`
- `[M5.H.9] [P0] feat(web): concierge SOS dashboard`
- `[EPIC 10] [P0] Гигиена репозитория`

## Приоритеты

| Label | Значение | Когда |
|-------|----------|-------|
| 🔴 P0 | Critical | Блокирует работу, нужно сейчас |
| 🟠 P1 | High | Важно для текущего milestone |
| 🟡 P2 | Medium | Желательно в этом спринте |
| 🟢 P3 | Low | Backlog, когда будет время |

## Статусы в Project Board

| Статус | Когда |
|--------|-------|
| 📋 Backlog | Создан, не взят в работу |
| 🔄 In Progress | Есть ветка, идёт разработка |
| 👀 In Review | Открыт PR, идёт ревью |
| ✅ Done | Смёржено в main |
| 🚫 Blocked | Есть блокер, нужна помощь |

## Жизненный цикл issue

```
Backlog → (взял в работу) → In Progress
       → (открыл PR)     → In Review
       → (смёрджено)     → Done
       → (блокер)        → Blocked
```

## Автоматизация

- Новый issue → автоматически добавляется в [Project Board](https://github.com/users/Rivega42/projects/3)
- PR opened → статус меняется на **In Progress**
- PR ready for review → статус меняется на **In Review**  
- PR merged / Issue closed → статус меняется на **Done**
- Label P0/P1 → автоматически ставится приоритет в Project

## Эпики

Эпики — это большие issue с тегом `[EPIC N]`. Они группируют связанные задачи.
Подзадачи ссылаются на эпик через `Part of #N`.

## Шаблон bug report

```markdown
## Описание
Что сломано.

## Шаги воспроизведения
1. ...
2. ...

## Ожидаемое поведение
...

## Фактическое поведение
...

## Окружение
- Платформа: iOS / Android / Web
- Версия: x.x.x
```

## Шаблон feature request

```markdown
## Что нужно
...

## Зачем
...

## Для кого
- [ ] Клиент
- [ ] Гид  
- [ ] Менеджер
- [ ] Управляющий
```
