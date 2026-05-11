#!/usr/bin/env bash
# Usage: ./scripts/push-github.sh <github-personal-access-token> [repo-name] [github-username]
#
# Creates a public GitHub repo and pushes the current branch.
# Requires: gh CLI at ~/.local/bin/gh (already installed by CTO agent)
set -euo pipefail

GH_TOKEN="${1:-}"
REPO_NAME="${2:-khu-email-manager}"
GH_USER="${3:-}"

if [ -z "$GH_TOKEN" ]; then
  echo "Usage: $0 <github-token> [repo-name] [github-username]"
  echo "Get a token at: https://github.com/settings/tokens/new?scopes=repo"
  exit 1
fi

GH="$HOME/.local/bin/gh"

echo "$GH_TOKEN" | "$GH" auth login --with-token
echo "Authenticated as: $("$GH" api user -q .login)"

GH_USER="${GH_USER:-$("$GH" api user -q .login)}"

# Create repo if it doesn't exist
if ! "$GH" repo view "$GH_USER/$REPO_NAME" &>/dev/null; then
  "$GH" repo create "$REPO_NAME" --public --description "AI-powered email manager built with Next.js, Supabase, and Claude"
  echo "Created repo: https://github.com/$GH_USER/$REPO_NAME"
fi

cd "$(dirname "$0")/.."

REMOTE_URL="https://$GH_TOKEN@github.com/$GH_USER/$REPO_NAME.git"
git remote add origin "$REMOTE_URL" 2>/dev/null || git remote set-url origin "$REMOTE_URL"
git push -u origin main

echo ""
echo "Pushed to: https://github.com/$GH_USER/$REPO_NAME"
echo ""
echo "Next step — deploy to Vercel (free hobby plan):"
echo "  npx vercel --prod"
echo "  (log in with your GitHub account when prompted)"
