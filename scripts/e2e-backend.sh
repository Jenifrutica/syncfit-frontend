#!/usr/bin/env bash
# Backend local para la suite Playwright (puerto 8001: el 8000 suele estar ocupado).
set -euo pipefail
cd "$(dirname "$0")/../../syncfit-backend"
set -a
. "${SYNCFIT_ENV:-$HOME/.config/syncfit/local.env}"
set +a
export PYTHONPATH=".:../syncfit-contracts/python:../syncfit-core:../syncfit-simulator/py:../syncfit-database:../syncfit-ai-reasoning"
exec python3 -m uvicorn app.main:app --host 127.0.0.1 --port "${E2E_API_PORT:-8001}"
