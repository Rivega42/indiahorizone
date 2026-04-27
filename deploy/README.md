# Deploy artifacts

Артефакты для разворачивания IndiaHorizone на серверах.

## Текущие deployment'ы

### dev — `2.56.241.126:3010`

- **Issue:** #320
- **Compose:** `docker-compose.dev.yml`
- **Что включено:** apps/web (Next.js standalone)
- **Что НЕ включено:** apps/api (NestJS — будет позже, когда [12.4] Lead закроется)
- **Доступ:** `http://2.56.241.126:3010`
- **Auto-deploy:** push в main → GitHub Actions `.github/workflows/deploy-dev.yml`
- **Manual deploy:** Actions → "Deploy to dev" → "Run workflow" → ветка

## Layout на сервере

```
/opt/indiahorizone/
├── docker-compose.dev.yml      ← из этого каталога
├── deploy/                     ← git clone repo (CI git pull сюда)
└── (logs / volumes — Caddy/nginx если будут)
```

## Setup — однократно (Vika по issue #320)

Подробные шаги — в issue #320. Кратко:

```bash
ssh root@2.56.241.126

# Discovery (обязательно перед изменениями!)
docker ps && netstat -tlnp && nginx -T 2>/dev/null

# Подготовка нашего каталога
sudo mkdir -p /opt/indiahorizone && sudo chown $USER /opt/indiahorizone
cd /opt/indiahorizone
git clone https://github.com/Rivega42/indiahorizone.git deploy
cp deploy/deploy/docker-compose.dev.yml ./docker-compose.dev.yml

# Initial deploy
docker compose -f docker-compose.dev.yml up -d --build
```

## GitHub Secrets (Vika добавляет)

- `DEV_SSH_HOST` = `2.56.241.126`
- `DEV_SSH_USER` = `root` (или `ubuntu` — что у Roman'а)
- `DEV_SSH_KEY` = приватный deploy-key (публичный — на сервер в `~/.ssh/authorized_keys`)
