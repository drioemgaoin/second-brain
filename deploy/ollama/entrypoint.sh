#!/bin/sh
set -e

# Models to pull — set via environment variables
EMBEDDING_MODEL="${EMBEDDING_MODEL:-nomic-embed-text}"
CHAT_MODEL="${CHAT_MODEL:-llama3.2}"

# Start Ollama server in the background
echo "Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "Waiting for Ollama to be ready..."
until curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; do
  sleep 2
done
echo "Ollama is ready."

# Pull models if not already present
for model in "$EMBEDDING_MODEL" "$CHAT_MODEL"; do
  if ollama list | grep -q "^${model}"; then
    echo "Model '${model}' already available."
  else
    echo "Pulling model '${model}'..."
    ollama pull "$model"
    echo "Model '${model}' pulled successfully."
  fi
done

echo "All models ready."

# Wait for the Ollama server process
wait $OLLAMA_PID
