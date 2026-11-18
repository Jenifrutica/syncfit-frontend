#!/usr/bin/env bash
# Export estático apuntando al backend local y servido como en producción.
set -euo pipefail
cd "$(dirname "$0")/.."
API="${E2E_API:-http://localhost:8001}"
NEXT_PUBLIC_API_URL="$API" NEXT_PUBLIC_DEMO_LOGIN=1 npx next build >/tmp/syncfit-e2e-build.log 2>&1 || { tail -40 /tmp/syncfit-e2e-build.log; exit 1; }
git checkout -- next-env.d.ts 2>/dev/null || true
exec python3 -m http.server "${E2E_PORT:-3100}" --bind 127.0.0.1 -d out
