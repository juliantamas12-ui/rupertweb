#!/bin/bash
# deploy.sh — deploy rupertweb Worker + purge Cloudflare cache.
# The live site is served by the "holy-hall-8d46" Worker (see wrangler.toml).
# After every deploy we must purge the zone cache because CF caches HTML
# aggressively despite the worker's no-store headers.

set -euo pipefail

cd "$(dirname "$0")"

# Wrangler deploy token (Workers Scripts/KV/R2/Pages/Zone Routes edit)
DEPLOY_TOKEN="${CLOUDFLARE_API_TOKEN:-cfut_q6i6vycg8Ea2r93TwDwtcDz9iTBIPNWF1UOy5ink1c206797}"
# Cache-purge-only token (Zone Cache Purge on rupertweb.com only)
PURGE_TOKEN="${CLOUDFLARE_PURGE_TOKEN:-cfut_nkQvSWIaX4HxdioiZlfgdU1uCEwRE2C4iqwA5O2u959375ff}"
ACCOUNT_ID="83e723be30278199fc80a3075ab9264d"
ZONE_ID="0ddcb6a074e5ed919c766bed183e2eb1"

echo "→ wrangler deploy"
CLOUDFLARE_API_TOKEN="$DEPLOY_TOKEN" CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID" \
  npx wrangler deploy "$@"

echo "→ purging Cloudflare cache for rupertweb.com"
resp=$(curl -sS -X POST \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${PURGE_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}')

if echo "$resp" | grep -q '"success":true'; then
  echo "  ✓ cache purged"
else
  echo "  ✗ cache purge FAILED:"
  echo "$resp"
  exit 1
fi

echo
echo "Deploy complete. Live at:"
echo "  https://rupertweb.com/ukufunda"
echo "  https://rupertweb.julian-tamas12.workers.dev/ukufunda.html (bypass)"
