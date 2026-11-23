#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -f .env ]; then
  echo "Missing .env. Run bash setup.sh first." >&2
  exit 1
fi
set -a
. ./.env
set +a
exec python -m uvicorn main:app --host 127.0.0.1 --port 8765
