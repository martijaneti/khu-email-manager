#!/usr/bin/env bash
# Usage: ./scripts/push-github.sh [github-personal-access-token] [repo-name]
#
# Creates a public GitHub repo via REST API and pushes the current branch.
# If token is omitted, uses the token already stored by `gh auth login`.
set -euo pipefail

GH="$HOME/.local/bin/gh"
REPO_NAME="${2:-khu-email-manager}"

# Use provided token or fall back to stored gh token
if [ -n "${1:-}" ]; then
  GH_TOKEN="$1"
  echo "$GH_TOKEN" | "$GH" auth login --with-token
else
  GH_TOKEN="$("$GH" auth token 2>/dev/null)"
  if [ -z "$GH_TOKEN" ]; then
    echo "No token found. Run: echo YOUR_TOKEN | ~/.local/bin/gh auth login --with-token"
    exit 1
  fi
fi

GH_USER="$("$GH" api user -q .login)"
echo "Authenticated as: $GH_USER"

# Check if repo exists; skip creation if it does (fine-grained PATs often can't create)
if "$GH" api "repos/$GH_USER/$REPO_NAME" &>/dev/null; then
  echo "Repo exists: https://github.com/$GH_USER/$REPO_NAME"
else
  # Attempt creation via REST API
  HTTP_STATUS=$(curl -s -o /tmp/gh-create-repo.json -w "%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    https://api.github.com/user/repos \
    -d "{\"name\":\"$REPO_NAME\",\"description\":\"AI-powered email manager — Next.js, Supabase, Claude\",\"private\":false,\"auto_init\":false}")

  if [ "$HTTP_STATUS" = "201" ]; then
    echo "Created repo: https://github.com/$GH_USER/$REPO_NAME"
  elif [ "$HTTP_STATUS" = "422" ]; then
    echo "Repo already exists — continuing with push"
  else
    echo ""
    echo "Cannot create repo (token permission). Please create it manually:"
    echo "  1. Go to https://github.com/new"
    echo "  2. Name it: $REPO_NAME  (public, no README/gitignore)"
    echo "  3. Re-run this script"
    echo ""
    cat /tmp/gh-create-repo.json
    exit 1
  fi
fi

cd "$(dirname "$0")/.."

REMOTE_URL="https://$GH_TOKEN@github.com/$GH_USER/$REPO_NAME.git"
git remote add origin "$REMOTE_URL" 2>/dev/null || git remote set-url origin "$REMOTE_URL"
git push -u origin main

echo ""
echo "Pushed to: https://github.com/$GH_USER/$REPO_NAME"
echo ""
echo "Next — deploy to Vercel (free hobby plan):"
echo "  npx vercel --prod"
