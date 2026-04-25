# 🌿 Ветки — IndiaHorizone

## Активные ветки

| Ветка | Описание | Issue |
|-------|----------|-------|
| `main` | Production-ready код | — |
| `feature/m5-a-1-pnpm-workspaces-111` | M5.A.1 pnpm workspaces setup | [#111](https://github.com/Rivega42/indiahorizone/issues/111) |
| `feature/m5-a-2-typescript-config-112` | M5.A.2 TypeScript конфиг | [#112](https://github.com/Rivega42/indiahorizone/issues/112) |
| `feature/m5-a-3-eslint-prettier-113` | M5.A.3 ESLint + Prettier | [#113](https://github.com/Rivega42/indiahorizone/issues/113) |
| `feature/m5-a-4-github-actions-ci-114` | M5.A.4 GitHub Actions CI | [#114](https://github.com/Rivega42/indiahorizone/issues/114) |
| `feature/m5-a-5-docker-compose-115` | M5.A.5 Docker Compose | [#115](https://github.com/Rivega42/indiahorizone/issues/115) |
| `feature/m5-a-6-nestjs-scaffold-116` | M5.A.6 NestJS scaffold | [#116](https://github.com/Rivega42/indiahorizone/issues/116) |
| `feature/m5-a-11-nextjs-scaffold-121` | M5.A.11 Next.js scaffold | [#121](https://github.com/Rivega42/indiahorizone/issues/121) |
| `docs/devops-vika-protocol` | DevOps протокол | — |
| `claude/code-review-DQJlm` | Code review от Claude | — |
| `claude/continue-roadmap-rfG4L` | Продолжение roadmap | — |

## Соглашения по именованию

```
feature/m{milestone}-{epic}-{num}-{slug}-{issue_number}
fix/{slug}-{issue_number}
docs/{slug}
refactor/{slug}
test/{slug}
chore/{slug}
```

## Правила

- Каждая ветка привязана к конкретному issue
- Ветка удаляется после merge
- PR обязательно ссылается на issue: `Closes #N`
- Squash merge в main (один коммит на фичу)

## Защита main

- Требуется минимум 1 апрув
- CI должен пройти
- Прямые коммиты в main — только hotfix
