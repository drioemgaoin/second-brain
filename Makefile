# second-brain — short commands.  Run `make help` to list them.

EMBEDDING_MODEL ?= ollama:nomic-embed-text
CHAT_MODEL     ?= llama3.2

.PHONY: help up down pull-model pull-chat-model init mcp seed import doctor search note logs \
        api-setup api-dev api-build chat-setup chat-dev chat-build serve dev setup \
        deploy-build deploy-up deploy-down deploy-logs deploy-pull-model deploy-seed deploy-import

help:
	@echo "second-brain commands:"
	@echo ""
	@echo "  Brain management:"
	@echo "    make up              Start Ollama in Docker"
	@echo "    make down            Stop Ollama"
	@echo "    make pull-model      Download the embedding model"
	@echo "    make pull-chat-model Download the chat model ($(CHAT_MODEL))"
	@echo "    make init            Create the local PGLite brain"
	@echo "    make mcp             Wire the brain into Claude Code"
	@echo "    make serve           Start GBrain HTTP server (port 3002)"
	@echo "    make seed            Load the public examples into the brain"
	@echo "    make import          Load your private notes into the brain"
	@echo "    make note area=ai-learning title=\"...\"   Create a tagged note"
	@echo "    make search q=\"...\"   Raw retrieval (no Claude Code)"
	@echo "    make doctor          Health check"
	@echo "    make logs            Tail Ollama logs"
	@echo ""
	@echo "  API service (port 3001):"
	@echo "    make api-setup       Install API dependencies"
	@echo "    make api-dev         Start API dev server"
	@echo "    make api-build       Build API for production"
	@echo ""
	@echo "  Chat frontend (port 3000):"
	@echo "    make chat-setup      Install chat frontend dependencies"
	@echo "    make chat-dev        Start chat frontend dev server"
	@echo "    make chat-build      Build chat frontend for production"
	@echo ""
	@echo "  Full stack:"
	@echo "    make setup           Install all dependencies"
	@echo "    make dev             Start everything for local development"
	@echo ""
	@echo "  Production deployment (VPS):"
	@echo "    make deploy-build    Build production Docker images"
	@echo "    make deploy-up       Start production stack"
	@echo "    make deploy-down     Stop production stack"
	@echo "    make deploy-logs     Tail production logs"
	@echo "    make deploy-pull-model  Pull Ollama models in production"
	@echo "    make deploy-seed     Load example notes in production"
	@echo "    make deploy-import   Import notes in production"

# --- Brain management ---

up:
	docker compose up -d

down:
	docker compose down

pull-model:
	docker exec second-brain-ollama ollama pull nomic-embed-text

pull-chat-model:
	docker exec second-brain-ollama ollama pull $(CHAT_MODEL)

init:
	gbrain init --pglite --embedding-model $(EMBEDDING_MODEL)

mcp:
	claude mcp add --transport http second-brain http://localhost:3001/mcp

# Start GBrain HTTP server (the API service connects to this)
serve:
	gbrain serve --http --port 3002

seed:
	gbrain import brain/examples/

import:
	gbrain import notes/

# Usage: make note area=ai-learning title="LangGraph basics"
note:
	bash brain/scripts/note.sh "$(area)" "$(title)"

# Usage: make search q="rag evaluation tools"
search:
	gbrain search "$(q)"

doctor:
	gbrain doctor

logs:
	docker compose logs -f ollama

# --- Setup (all dependencies) ---

setup: api-setup chat-setup
	@echo "Dependencies installed. Copy env files if needed:"
	@echo "  cp app/api/.env.example app/api/.env"
	@echo "  cp app/chat/.env.local.example app/chat/.env.local"

# --- API service ---

api-setup:
	cd app/api && npm install

api-dev:
	cd app/api && npm run dev

api-build:
	cd app/api && npm run build

# --- Chat frontend ---

chat-setup:
	cd app/chat && npm install

chat-dev:
	cd app/chat && npm run dev

chat-build:
	cd app/chat && npm run build

# --- Full stack ---

# Start everything for local dev (Ollama + GBrain HTTP + API + Chat)
# Claude Code's MCP connects to the same GBrain HTTP server — no conflicts.
dev:
	@echo "Starting Ollama..."
	@docker compose up -d
	@echo "Starting GBrain HTTP on :3002, API on :3001, Chat on :3000..."
	@echo "Press Ctrl+C to stop."
	@trap 'kill 0' EXIT; \
		gbrain serve --http --port 3002 & \
		sleep 2 && cd app/api && npm run dev & \
		cd app/chat && npm run dev

# --- Production deployment (VPS) ---

deploy-build:
	docker compose -f docker-compose.prod.yml build

deploy-up:
	docker compose -f docker-compose.prod.yml up -d

deploy-down:
	docker compose -f docker-compose.prod.yml down

deploy-logs:
	docker compose -f docker-compose.prod.yml logs -f

deploy-pull-model:
	docker exec second-brain-ollama ollama pull nomic-embed-text
	docker exec second-brain-ollama ollama pull $(CHAT_MODEL)

deploy-seed:
	docker cp brain/examples/. second-brain-gbrain:/tmp/examples
	docker exec second-brain-gbrain gbrain import /tmp/examples

deploy-import:
	docker cp notes/. second-brain-gbrain:/tmp/notes
	docker exec second-brain-gbrain gbrain import /tmp/notes
