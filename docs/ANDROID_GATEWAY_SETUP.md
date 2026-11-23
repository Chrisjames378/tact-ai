# TACT AI Guardian — Android gateway setup

The Android app now talks to the Node.js gateway over HTTPS.

## Configure the gateway

1. Deploy the `server/` directory as a Node.js service on Render or Railway.
2. Set `APP_TOKEN` to a long, random secret generated in your hosting provider's secret/environment-variable settings.
3. Set exactly one model provider:
   - Groq: `MODEL_PROVIDER=groq` and `GROQ_API_KEY`
   - Gemini: `MODEL_PROVIDER=gemini` and `GEMINI_API_KEY`
4. Keep these values in the hosting provider's secret store. Never commit them or paste them into the Android app.
5. Confirm the deployed service's `/health` endpoint reports `ok: true` and `aiConfigured: true`.

## Connect the Android app

1. Open TACT AI Guardian and select Settings.
2. Enter the deployed service's HTTPS base URL (for example, `https://your-service.example.com`).
3. Enter the same `APP_TOKEN` value configured on the server.
4. Select **Save securely**. The token is encrypted locally using an AES-GCM key held by Android Keystore.
5. Open Assistant and send a test prompt.

The app does not accept plain HTTP gateway URLs. The server's `/v1/chat` endpoint requires Bearer authentication. Provider API keys remain server-side.

## Current boundaries

- Chat requests are sent only after the user presses Send.
- This first Android client sends the current prompt as a single-message conversation; durable chat history is not implemented yet.
- The gateway's action-preparation endpoint creates approval requests only. It does not send messages, place calls, deploy code, or modify databases.
- No always-on microphone, SMS reading, call interception, or background surveillance is enabled.
- Do not use a production database or production credentials for development tests.
