#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
pkg update -y
pkg install -y python
python -m pip install --upgrade pip
python -m pip install -r "$(dirname "$0")/requirements.txt"
cd "$(dirname "$0")"
if [ ! -f .env ]; then
  TOKEN="$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"
  printf 'TACT_LOCAL_TOKEN=%s\n' "$TOKEN" > .env
  chmod 600 .env
fi
mkdir -p data
echo "TACT Termux companion installed."
echo "Start it with: bash $(dirname "$0")/start.sh"
echo "The API binds only to 127.0.0.1:8765."
