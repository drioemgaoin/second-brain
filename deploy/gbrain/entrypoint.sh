#!/bin/sh

# Export OLLAMA_BASE_URL so gbrain uses the container hostname, not localhost
export OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://ollama:11434/v1}"
export OLLAMA_HOST="${OLLAMA_HOST:-http://ollama:11434}"

# Wait for Ollama to be reachable
echo "Waiting for Ollama..."
until curl -sf "${OLLAMA_HOST}/api/tags" > /dev/null 2>&1; do
  sleep 2
done
echo "Ollama is ready."

CONFIG=/root/.gbrain/config.json

# Initialize the brain if it doesn't exist
if [ ! -f "$CONFIG" ]; then
  echo "Initializing GBrain (OLLAMA_BASE_URL=$OLLAMA_BASE_URL)..."
  gbrain init --pglite --skip-embed-check --embedding-model "${EMBEDDING_MODEL:-ollama:nomic-embed-text}"
fi

# GBrain binds to 127.0.0.1 only — use socat to expose on 0.0.0.0
# so other containers can reach it.
echo "Starting GBrain HTTP server on port 3002..."
gbrain serve --http --port 3002 --enable-dcr &
GBRAIN_PID=$!

# Wait for GBrain to start listening
until curl -sf http://127.0.0.1:3002/health > /dev/null 2>&1; do
  sleep 1
done

echo "Forwarding 0.0.0.0:3003 -> 127.0.0.1:3002..."
socat TCP-LISTEN:3003,fork,reuseaddr TCP:127.0.0.1:3002 &

wait $GBRAIN_PID
