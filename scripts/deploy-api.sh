#!/usr/bin/env bash
# Deploy Swiss Ephemeris API worker to ephemeris.castalia.institute/api/*
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${CASTALIA_ENV:-$ROOT/../castalia.institute/.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" && -n "${CLOUDFLARE_TOKEN:-}" ]]; then
  export CLOUDFLARE_API_TOKEN="$CLOUDFLARE_TOKEN"
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Set CLOUDFLARE_API_TOKEN (Workers + Zone DNS edit on castalia.institute)." >&2
  exit 1
fi

cd "$ROOT/worker"
npm install --ignore-scripts
npx wrangler deploy

echo ""
echo "Test:"
echo "  curl -sS 'https://ephemeris.castalia.institute/api/v1/positions?epoch=$(date +%s)' | head"
