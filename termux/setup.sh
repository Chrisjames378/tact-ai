#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v pkg >/dev/null 2>&1; then
  echo "This installer must be run inside Termux." >&2
  exit 1
fi

echo "[1/4] Updating Termux package lists…"
pkg update -y
echo "[2/4] Installing Python…"
pkg install -y python

# Termux owns its pip package. Do not run 'pip install --upgrade pip':
# that can corrupt Termux's package-managed Python installation.
echo "[3/4] Installing application dependencies…"
python -m pip install --no-cache-dir -r requirements.txt

echo "[4/4] Preparing private local configuration…"
if [ ! -f .env ]; then
  TOKEN="$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"
  umask 077
  printf 'TACT_LOCAL_TOKEN=%s\n' "$TOKEN" > .env
fi
chmod 600 .env
mkdir -p data

echo
echo "TACT Termux companion installed."
echo "Start it with: bash start.sh"
echo "Health check (from another Termux session):"
echo "  curl http://127.0.0.1:8765/health"
echo "Security: service binds to 127.0.0.1 only. Do not expose port 8765."
