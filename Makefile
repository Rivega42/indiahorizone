.PHONY: help up down logs ps restart reset shell-postgres shell-redis

help: ## Показать список команд
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Поднять Postgres + Redis + MinIO в фоне
	docker compose up -d

down: ## Остановить и удалить контейнеры (volumes сохраняются)
	docker compose down

logs: ## Хвост логов всех сервисов
	docker compose logs -f --tail=50

ps: ## Статус сервисов
	docker compose ps

restart: ## Перезапустить все сервисы
	docker compose restart

reset: ## ⚠️  Снести контейнеры и volumes (потеря всех локальных данных)
	docker compose down -v

shell-postgres: ## psql shell в контейнере Postgres
	docker compose exec postgres psql -U $${POSTGRES_USER:-indiahorizone} -d $${POSTGRES_DB:-indiahorizone}

shell-redis: ## redis-cli в контейнере Redis
	docker compose exec redis redis-cli
