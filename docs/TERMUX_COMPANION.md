# Termux companion architecture

TACT AI Guardian can optionally pair with a local Termux Python service at `http://localhost:8765`.

- `GET /health`: unauthenticated, non-sensitive liveness check for the Android UI.
- `GET /v1/status`: bearer-token protected service status.
- `GET /v1/approvals`: protected local SQLite approval queue.
- `POST /v1/approvals`: protected request creation.
- `POST /v1/approvals/{id}/decision`: protected decision recording only; response explicitly reports `executed:false`.

The server binds to `127.0.0.1` only. It must not be exposed to the LAN or public internet. The Android app allows cleartext HTTP only for the exact localhost hostname; the remote gateway remains HTTPS-only.

Termux is optional. Android app startup, phone diagnostics, encrypted chat history, and remote gateway use continue without Termux.
