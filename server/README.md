# TACT AI Guardian Gateway

Node.js 20+ backend for the Android companion.

## Run locally
1. Copy `.env.example` to `.env` and set a long random `APP_TOKEN`.
2. Set exactly one provider key and select `MODEL_PROVIDER=groq` or `gemini`.
3. Export the variables in your shell, then run `npm test` and `npm start`.

## Endpoints
- `GET /health`: public service status; does not expose secrets.
- `POST /v1/chat`: bearer-authenticated model request.
- `POST /v1/actions/prepare`: bearer-authenticated approval request, saved to the approval queue.
- `GET /v1/approvals`: list saved approval requests.
- `POST /v1/approvals/:id/decision`: record `approved` or `denied`. A decision is recorded only; it does not execute the action.

## Deployment
Deploy as a Node.js service on Render or Railway. Set secrets in the host's environment settings, use HTTPS, configure a strong APP_TOKEN and restrict access at the edge if possible. Do not put provider keys or APP_TOKEN in the Android app or Git repository.

Approval records are written under `DATA_DIR` (default `./data`). Configure this to a mounted persistent disk path on your host, otherwise records may be lost when the service is redeployed or its instance is replaced. The queue is bounded to the latest 200 requests. The Android app stores up to 40 recent chat messages encrypted with Android Keystore on the device; the gateway does not yet provide cross-device chat history.

## Current limitations
No OAuth integrations, messaging senders, call control or background task scheduler are implemented yet. Approval decisions are audit records only and must not be treated as proof that an action was executed. External integrations require separate consent flows, provider-specific scopes, execution adapters and audit controls.
