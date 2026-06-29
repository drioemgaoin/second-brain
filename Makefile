# second-brain — short commands.  Run `make help` to list them.

EMBEDDING_MODEL ?= ollama:nomic-embed-text

.PHONY: help up down pull-model init mcp seed import doctor search note logs

help:
	@echo "second-brain commands:"
	@echo "  make up           Start Ollama in Docker"
	@echo "  make pull-model   Download the free embedding model"
	@echo "  make init         Create the local PGLite brain"
	@echo "  make mcp          Wire the brain into Claude Code"
	@echo "  make seed         Load the public examples/ into the brain"
	@echo "  make import       Load your private notes/ into the brain"
	@echo "  make note area=ai-learning title=\"...\"   Create a tagged note"
	@echo "  make search q=\"...\"   Raw retrieval (no Claude Code)"
	@echo "  make doctor       Health check"
	@echo "  make down         Stop Ollama"
	@echo "  make logs         Tail Ollama logs"

up:
	docker compose up -d

down:
	docker compose down

pull-model:
	docker exec second-brain-ollama ollama pull nomic-embed-text

init:
	gbrain init --pglite --embedding-model $(EMBEDDING_MODEL)

mcp:
	claude mcp add gbrain -- gbrain serve

seed:
	gbrain import examples/

import:
	gbrain import notes/

# Usage: make note area=ai-learning title="LangGraph basics"
note:
	bash scripts/note.sh "$(area)" "$(title)"

# Usage: make search q="rag evaluation tools"
search:
	gbrain search "$(q)"

doctor:
	gbrain doctor

logs:
	docker compose logs -f ollama
