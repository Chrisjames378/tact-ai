# TACT AI Guardian Gateway

Node.js 20+ backend for the Android companion.

## Run locally
1. Copy `.env.example` to `.env` and set a long random `APP_TOKEN`.
2. Set exactly one provider key and select `MODEL_PROVIDER=groq` or `gemini`.
3. Export the variables in your shell, then run `npm test` and `npm start`.

## Endpoints
- `GET /health`: public service status; does not expose secrets.
- `POST /v1/chat`: bearer-authenticated model request.
- `POST /v1/actions/prepare`: bearer-authenticated approval request. This endpoint deliberately never executes the action.

## Deployment
Deploy as a Node.js service on Render or Railway. Set secrets in the host's environment settings, use HTTPS, configure a strong APP_TOKEN and restrict access at the edge if possible. Do not put provider keys or APP_TOKEN in the Android app or Git repository.

## Current limitations
No durable chat memory, OAuth integrations, messaging senders, call control or background task scheduler are implemented yet. Those require separate consent flows, provider-specific scopes, persistence and audit controls.
