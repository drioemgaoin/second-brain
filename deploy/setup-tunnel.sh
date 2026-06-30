#!/bin/bash
set -e

# Setup a Cloudflare Named Tunnel for the second-brain API.
# This gives a stable HTTPS URL that never changes across restarts.
#
# Usage: bash deploy/setup-tunnel.sh [tunnel-name]
#
# Prerequisites: Docker must be installed.

TUNNEL_NAME="${1:-second-brain-api}"
VOLUME_NAME="cloudflared-setup"
CRED_DIR="$(cd "$(dirname "$0")" && pwd)/cloudflared"

echo "==> Step 1: Authenticate with Cloudflare"
echo "    A URL will be printed — open it in your browser and authorize."

# Prepare volume with correct permissions
docker volume rm "$VOLUME_NAME" 2>/dev/null || true
docker run --rm -v "$VOLUME_NAME:/home/nonroot/.cloudflared" alpine sh -c \
  "chown -R 65532:65532 /home/nonroot/.cloudflared"

# Login
docker run --rm -it -v "$VOLUME_NAME:/home/nonroot/.cloudflared" \
  cloudflare/cloudflared:latest tunnel login

echo ""
echo "==> Step 2: Creating named tunnel '$TUNNEL_NAME'"

TUNNEL_OUTPUT=$(docker run --rm -v "$VOLUME_NAME:/home/nonroot/.cloudflared" \
  cloudflare/cloudflared:latest tunnel create "$TUNNEL_NAME" 2>&1)

echo "$TUNNEL_OUTPUT"

# Extract tunnel ID
TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oP '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)

if [ -z "$TUNNEL_ID" ]; then
  echo "ERROR: Could not extract tunnel ID from output."
  exit 1
fi

echo ""
echo "==> Step 3: Copying credentials"
mkdir -p "$CRED_DIR"

# Copy credentials from volume
docker run --rm -v "$VOLUME_NAME:/home/nonroot/.cloudflared" \
  alpine cat "/home/nonroot/.cloudflared/${TUNNEL_ID}.json" > "$CRED_DIR/credentials.json"

# Write config
cat > "$CRED_DIR/config.yml" << EOF
tunnel: $TUNNEL_ID
credentials-file: /home/nonroot/.cloudflared/credentials.json

ingress:
  - service: http://api:3001
EOF

# Cleanup setup volume
docker volume rm "$VOLUME_NAME" 2>/dev/null || true

echo ""
echo "============================================"
echo "  Tunnel setup complete!"
echo "============================================"
echo ""
echo "  Tunnel ID:  $TUNNEL_ID"
echo "  Stable URL: https://${TUNNEL_ID}.cfargotunnel.com"
echo ""
echo "  Files created:"
echo "    deploy/cloudflared/credentials.json"
echo "    deploy/cloudflared/config.yml"
echo ""
echo "  Next steps:"
echo "    1. Set NEXT_PUBLIC_API_URL in Cloudflare Pages to:"
echo "       https://${TUNNEL_ID}.cfargotunnel.com"
echo "    2. Add credentials.json to .gitignore (already done)"
echo "    3. Deploy: make deploy-build && make deploy-up"
echo ""
