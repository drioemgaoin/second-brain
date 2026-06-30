#!/usr/bin/env bash
# Install second-brain for Claude Code (desktop).
#
# Usage:
#   bash install.sh https://api.yourdomain.com
#
# Or without cloning:
#   curl -sL https://raw.githubusercontent.com/drioemgaoin/second-brain/main/install.sh | bash -s https://api.yourdomain.com
#
# What it does:
#   1. Registers the MCP endpoint for Claude Code (CLI, IDE, desktop app)
#   2. Installs the brain skill (auto-triggers on note-related requests)
#   3. Pre-approves MCP tool permissions
#
# For mobile, use the web chatbot instead (no setup needed).
set -euo pipefail

API_URL="${1:?Usage: bash install.sh https://api.yourdomain.com}"
REPO_RAW="https://raw.githubusercontent.com/drioemgaoin/second-brain/main"

echo "==> Registering MCP endpoint: ${API_URL}/mcp"
claude mcp add --transport http --scope user second-brain "${API_URL}/mcp"

echo "==> Installing skill"
mkdir -p ~/.claude/skills/second-brain
curl -sfL "${REPO_RAW}/.claude/skills/second-brain/SKILL.md" \
  -o ~/.claude/skills/second-brain/SKILL.md

echo "==> Configuring permissions"
SETTINGS=~/.claude/settings.json
PERMISSION="mcp__second-brain__*"

if [ -f "$SETTINGS" ]; then
  if grep -q "$PERMISSION" "$SETTINGS" 2>/dev/null; then
    echo "    Permissions already configured."
  else
    echo "    WARNING: ~/.claude/settings.json exists. Add this to permissions.allow:"
    echo "    \"${PERMISSION}\""
  fi
else
  cat > "$SETTINGS" << 'EOF'
{
  "permissions": {
    "allow": [
      "mcp__second-brain__*"
    ]
  }
}
EOF
  echo "    Created ${SETTINGS}"
fi

echo ""
echo "Done! Open Claude Code in any project and try:"
echo "  > What did I write about RAG?"
echo "  > Save a note from our conversation."
echo "  > Show me my notes."
echo ""
echo "For mobile, use the web chatbot — no setup needed."
