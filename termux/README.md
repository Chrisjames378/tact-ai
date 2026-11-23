# TACT AI Guardian — Termux companion

This optional Termux service runs locally on the same Android phone as TACT AI Guardian. It is not required for the native app to launch.

## Install

1. Install Termux from its official F-Droid or GitHub distribution. Avoid mixing Termux and plugin apps from different sources.
2. Clone the TACT repository in Termux, or copy the `termux/` folder into `~/tact-ai/termux`.
3. Run:

```sh
cd ~/tact-ai/termux
bash setup.sh
bash start.sh
```

Keep the Termux session running while testing. The service listens only on `127.0.0.1:8765`, not on the Wi-Fi/LAN interface.

## Check it

In a second Termux session:

```sh
curl http://127.0.0.1:8765/health
```

Expected response includes `"status":"ok"`.

## Android app

In TACT AI Guardian > Settings > Termux companion, use **Test local connection**. The app checks `http://localhost:8765/health`; it does not need your token for this non-sensitive health check.

The generated `.env` contains a random local API token. It is not committed to Git and must not be pasted into chat. Authenticated local status and approval endpoints require this token. Decisions are recorded only: `executed:false`.

## Security and limits

- Loopback-only binding: do not change the host to `0.0.0.0`.
- Do not expose port 8765 through a tunnel, router port-forward, or public reverse proxy.
- The health endpoint reveals only service health; other API routes require the generated bearer token.
- Local approval decisions never send messages, make calls, publish deployments, change repositories, or spend ad budget.
- Termux may be stopped by Android battery management. Keep it open during use; optional boot automation can be added later with Termux:Boot after manual testing.
- This is a local development companion, not a replacement for the remote HTTPS AI gateway.
