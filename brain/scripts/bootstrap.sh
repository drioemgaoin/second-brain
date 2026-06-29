#!/usr/bin/env bash
# One-shot first-time setup for second-brain.
# Run from the project root:  bash scripts/bootstrap.sh
set -euo pipefail

EMBEDDING_MODEL="ollama:nomic-embed-text"

echo "==> Checking prerequisites"
command -v docker >/dev/null || { echo "Docker not found. Install Docker first."; exit 1; }
command -v bun    >/dev/null || { echo "Bun not found. Install from https://bun.sh"; exit 1; }
command -v claude >/dev/null || echo "WARN: claude CLI not found on PATH (needed for 'make mcp')."

echo "==> Installing GBrain (host)"
bun install -g github:garrytan/gbrain

echo "==> Starting Ollama in Docker"
docker compose up -d

echo "==> Waiting for Ollama to be ready"
until docker exec second-brain-ollama ollama list >/dev/null 2>&1; do sleep 1; done

echo "==> Pulling the free embedding model"
docker exec second-brain-ollama ollama pull nomic-embed-text

echo "==> Smoke-testing the provider"
gbrain providers test --model "$EMBEDDING_MODEL" || {
  echo "Provider test failed. Run 'gbrain doctor' for the exact fix."; exit 1; }

echo "==> Creating the local brain"
gbrain init --pglite --embedding-model "$EMBEDDING_MODEL"
gbrain doctor

echo "==> Loading public example notes (all areas)"
gbrain import brain/examples/

if find notes -name '*.md' ! -name 'README.md' | grep -q .; then
  echo "==> Loading your private notes"
  gbrain import notes/
fi

echo
echo "Done. Next: run 'make mcp' to wire the brain into Claude Code,"
echo "then ask Claude Code a question, e.g.:"
echo "  \"From my ai-learning notes, what did I record about RAG evaluation?\""
