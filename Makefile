.PHONY: help install dev build up down logs clean seed

help:
	@echo "AgroMarket Enterprise - Available Commands"
	@echo "=========================================="
	@echo "make install       - Install dependencies for backend and frontend"
	@echo "make dev           - Start services with Docker Compose (dev mode)"
	@echo "make build         - Build Docker images"
	@echo "make up            - Start all services"
	@echo "make down          - Stop all services"
	@echo "make logs          - View Docker logs"
	@echo "make logs-backend  - View backend logs"
	@echo "make logs-frontend - View frontend logs"
	@echo "make clean         - Remove containers and volumes"
	@echo "make seed          - Seed the database with sample data"
	@echo "make test          - Run tests"
	@echo ""

install:
	cd backend && npm install
	cd frontend && npm install

dev:
	docker compose up --build

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

clean:
	docker compose down -v
	rm -rf backend/dist backend/node_modules
	rm -rf frontend/.next frontend/node_modules

seed:
	docker compose exec backend npm run seed

test:
	cd backend && npm test || true
	cd frontend && npm test || true

ps:
	docker compose ps

shell-backend:
	docker compose exec backend sh

shell-frontend:
	docker compose exec frontend sh

restart:
	docker compose restart

reset: clean up seed
	@echo "✅ Reset complete!"
