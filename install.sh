#!/usr/bin/env bash
# Install second-brain for Claude Code — all platforms.
#
# Usage:
#   bash install.sh https://api.yourdomain.com
#
# Or without cloning:
#   curl -sL https://raw.githubusercontent.com/OWNER/second-brain/main/install.sh | bash -s https://api.yourdomain.com
#
# What it does:
#   1. Registers the MCP endpoint for desktop Claude Code (CLI, IDE, desktop app)
#   2. Installs the skill globally for desktop
#   3. Creates a workspace repo you push to GitHub for mobile/web Claude Code
set -euo pipefail

API_URL="${1:?Usage: bash install.sh https://api.yourdomain.com}"
REPO_RAW="https://raw.githubusercontent.com/OWNER/second-brain/main"
WORKSPACE=~/second-brain-workspace

# ── Desktop setup ────────────────────────────────────────────────────────

echo "==> Desktop: registering MCP endpoint"
claude mcp add --transport http --scope user second-brain "${API_URL}/mcp"

echo "==> Desktop: installing skill"
mkdir -p ~/.claude/skills/second-brain
curl -sfL "${REPO_RAW}/.claude/skills/second-brain/SKILL.md" \
  -o ~/.claude/skills/second-brain/SKILL.md

echo "==> Desktop: configuring permissions"
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

# ── Mobile / Web workspace ───────────────────────────────────────────────

echo "==> Creating workspace for mobile/web: ${WORKSPACE}"
mkdir -p "${WORKSPACE}/.claude/skills/second-brain"

# .mcp.json — tells Claude Code where the MCP server is
cat > "${WORKSPACE}/.mcp.json" << EOF
{
  "mcpServers": {
    "second-brain": {
      "type": "http",
      "url": "${API_URL}/mcp"
    }
  }
}
EOF

# Skill — ensures Claude uses the MCP tools correctly
cp ~/.claude/skills/second-brain/SKILL.md \
   "${WORKSPACE}/.claude/skills/second-brain/SKILL.md"

# Settings — pre-approves MCP permissions
cat > "${WORKSPACE}/.claude/settings.json" << 'EOF'
{
  "permissions": {
    "allow": [
      "mcp__second-brain__*"
    ]
  }
}
EOF

# Init git repo and push to GitHub
if [ ! -d "${WORKSPACE}/.git" ]; then
  git -C "${WORKSPACE}" init -q
  git -C "${WORKSPACE}" add -A
  git -C "${WORKSPACE}" commit -q -m "second-brain workspace"
fi

echo "==> Pushing workspace to GitHub (private repo)"
if command -v gh >/dev/null 2>&1; then
  cd "${WORKSPACE}"
  gh repo create second-brain-workspace --private --source . --push 2>/dev/null \
    || git push -u origin main 2>/dev/null \
    || echo "    Repo already exists — pushed latest changes."
else
  echo "    WARNING: gh CLI not found. Install it (https://cli.github.com)"
  echo "    then run: cd ${WORKSPACE} && gh repo create second-brain-workspace --private --source . --push"
fi

echo ""
echo "Done!"
echo ""
echo "  DESKTOP  Open Claude Code in any project and try:"
echo "           > What did I write about RAG?"
echo "           > Save a note from our conversation."
echo ""
echo "  MOBILE   Open 'second-brain-workspace' in claude.ai/code on your phone."
echo ""
echo "  WEB      Visit your chatbot URL directly — no setup needed."
