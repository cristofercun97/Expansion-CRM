#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GH="$ROOT/.tools/gh"
REPO="cristofercun97/Expansion-CRM"

if [[ ! -x "$GH" ]]; then
  echo "Missing $GH — run from project root after gh is installed in .tools/"
  exit 1
fi

if ! "$GH" auth status >/dev/null 2>&1; then
  echo "GitHub CLI not authenticated. Run:"
  echo "  $GH auth login --hostname github.com --git-protocol ssh --web --skip-ssh-key"
  exit 1
fi

"$GH" repo edit "$REPO" \
  --description "CRM web para líderes y miembros — React, TypeScript, Firebase (Academia, contactos, presentaciones, radar)." \
  --add-topic react \
  --add-topic typescript \
  --add-topic firebase \
  --add-topic firestore \
  --add-topic crm \
  --add-topic vite \
  --add-topic tailwindcss

echo "Repository updated: https://github.com/$REPO"
