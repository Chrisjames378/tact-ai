# TACT AI Guardian

Native Android companion for the OPPO A6x: a permission-first personal assistant, device guardian and app-building copilot.

## Foundation status
This branch establishes the Android application shell and safe interaction model. It does not silently read messages, record calls, send communications, change device settings, or run privileged maintenance.

## Planned modules
- Assistant: text-first conversation shell, with voice integration to follow.
- Guardian: Android-supported battery, storage and app-health diagnostics.
- Communications: opt-in integrations and user-approved drafts/replies.
- Builder: GitHub-backed project assistant and deployment diagnostics.
- Memory: encrypted local preferences plus a secure backend integration to be added.
- Approval centre: explicit confirmation for external or destructive actions.

## Build
Open this repository in Android Studio (Hedgehog or newer), sync Gradle, then run the `app` configuration on an Android 8.0+ device.

Requirements: JDK 17, Android SDK 35.

## Safety
All external actions must pass through an approval gate. Credentials belong in Android Keystore-backed storage or server-side secrets, never source control.


## Personal workflow integrations

The Builder tab includes a service directory for the user's working tools:
- AI assistants and research: Gemini, ChatGPT, Claude, Grok, Genspark and Manus.
- AI development: Google AI Studio and OpenAI Platform.
- Advertising: X Ads and AdsGPT.
- Build and publish: GitHub and Vercel.

The directory is a catalogue, not a claim that accounts are connected. Each integration must pass its own supported OAuth/API setup and a connection test before being marked connected. API credentials stay on the gateway/server in environment secrets; they must never be embedded in the Android APK. Services without a verified public portal/API URL are left unlinked until configured. Publishing deployments, changing repositories, and modifying ad campaigns remain approval-gated.


## Optional Termux companion

A Python/FastAPI companion service can run on the same phone through Termux. It binds to loopback only at `127.0.0.1:8765`; the Android app can test its `/health` endpoint from Settings. It is optional and does not replace the HTTPS cloud gateway. See [Termux companion setup](docs/TERMUX_COMPANION.md) and the [Termux folder](termux/README.md).
