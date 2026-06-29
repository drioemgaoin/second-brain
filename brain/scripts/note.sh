#!/usr/bin/env bash
# Create a tagged note in the right area folder.
# Usage: bash scripts/note.sh <area> "<title>"
#   areas: ai-learning | quantum-physics | hiring | others
set -euo pipefail

AREA="${1:?area required: ai-learning | quantum-physics | hiring | others}"
TITLE="${2:?title required (quote it)}"

DIR="notes/$AREA"
if [ ! -d "$DIR" ]; then
  echo "Unknown area '$AREA'. Available:"; ls -1 notes | grep -v '\.md$'; exit 1
fi

SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-*//;s/-*$//')
FILE="$DIR/$SLUG.md"
if [ -e "$FILE" ]; then echo "Already exists: $FILE"; exit 1; fi

cat > "$FILE" << NOTE
---
area: $AREA
tags: [$AREA]
---

# $TITLE

NOTE

echo "Created $FILE"
echo "Edit it, then run:  make import"
