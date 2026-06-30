#!/bin/sh
set -e

# Wait for Ollama to be reachable
echo "Waiting for Ollama..."
until curl -sf "${OLLAMA_HOST:-http://ollama:11434}/api/tags" > /dev/null 2>&1; do
  sleep 2
done
echo "Ollama is ready."

# Initialize the brain if it doesn't exist
if [ ! -f /root/.gbrain/config.json ]; then
  echo "Initializing GBrain..."
  gbrain init --pglite --embedding-model "${EMBEDDING_MODEL:-ollama:nomic-embed-text}"
fi

echo "Starting GBrain HTTP server on port 3002..."
exec gbrain serve --http --port 3002 --host 0.0.0.0 --enable-dcr
