#!/bin/sh

# Wait for Ollama to be reachable
echo "Waiting for Ollama..."
until curl -sf "${OLLAMA_HOST:-http://ollama:11434}/api/tags" > /dev/null 2>&1; do
  sleep 2
done
echo "Ollama is ready."

OLLAMA_URL="${OLLAMA_HOST:-http://ollama:11434}"
CONFIG=/root/.gbrain/config.json

# Initialize the brain if it doesn't exist
if [ ! -f "$CONFIG" ]; then
  echo "Initializing GBrain..."
  gbrain init --pglite --embedding-model "${EMBEDDING_MODEL:-ollama:nomic-embed-text}" || true

  # If init failed or didn't create config, write it manually
  if [ ! -f "$CONFIG" ]; then
    echo "Writing config.json manually..."
    cat > "$CONFIG" << CONF
{
  "engine": "pglite",
  "database_path": "/root/.gbrain/brain.pglite",
  "ollama_host": "$OLLAMA_URL",
  "embedding_model": "ollama:nomic-embed-text",
  "embedding_dimensions": 768,
  "schema_pack": "gbrain-base-v2",
  "mcp": {
    "publish_skills": true
  },
  "self_upgrade": {
    "mode": "notify",
    "mode_prompted": true
  }
}
CONF
  fi
fi

# Ensure ollama_host is set in config (patch via awk)
TMP=/tmp/config_patched.json
awk -v url="$OLLAMA_URL" '
  NR==1 { print; if (!/ollama_host/) print "  \"ollama_host\": \"" url "\","; next }
  /\"ollama_host\"/ { print "  \"ollama_host\": \"" url "\","; next }
  { print }
' "$CONFIG" > "$TMP" && mv "$TMP" "$CONFIG"
echo "Config ready (ollama_host=$OLLAMA_URL)"
cat "$CONFIG"

# GBrain binds to 127.0.0.1 only — use socat to expose on 0.0.0.0
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
