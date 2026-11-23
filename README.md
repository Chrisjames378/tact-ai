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
