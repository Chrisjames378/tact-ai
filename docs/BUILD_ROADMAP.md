# TACT AI Guardian — build and release plan

## Product goal
A permission-first Android AI assistant and device guardian for the OPPO A6x, backed by an optional HTTPS AI gateway. The native app must remain useful when the optional Termux companion is stopped.

## Implemented foundation
- Kotlin + Jetpack Compose Android shell: Home, Assistant, Guardian, Builder and Settings.
- HTTPS gateway client with bearer token handling and Android Keystore-backed credential encryption.
- Encrypted local conversation history.
- Read-only Android battery/storage/device diagnostics.
- Optional six-hour WorkManager health checks; local-only data.
- Gateway approval queue UI. Decisions are recorded; they do not execute actions.
- Service catalogue for AI, developer, advertising and deployment tools.
- Optional loopback-only Termux FastAPI companion and Android health check.
- GitHub Actions gateway tests and Android debug APK build.

## Remaining build phases

### Phase 1 — reliability and security
- [ ] Fix and test Termux setup on current Termux Python (never upgrade package-managed pip).
- [ ] Add automated tests for Android gateway URL validation, token storage and error states.
- [ ] Add gateway request IDs, structured logs, rate limits and health/readiness separation.
- [ ] Add explicit timeout/retry policy with no duplicate action submissions.
- [ ] Add privacy/export/delete controls for local conversation history.
- [ ] Validate every external link and remove any placeholder connection claims.

### Phase 2 — complete assistant workflow
- [ ] Add streaming response support where gateway/provider supports it.
- [ ] Add conversation list, rename, delete and clear-all controls.
- [ ] Add configurable system persona and safe response preferences.
- [ ] Add voice input only after explicit microphone permission and visible user action.
- [ ] Add offline state and clear provider/model diagnostics.

### Phase 3 — guardian and approval centre
- [ ] Add Android-supported app version and permission inventory (no private app data).
- [ ] Add battery/storage trend history with user-controlled retention.
- [ ] Add approval detail view showing exact action, target, scope and expiry.
- [ ] Require fresh confirmation for destructive or external operations.
- [ ] Keep approvals non-executing until a separate, auditable executor is designed and tested.

### Phase 4 — builder and integrations
- [ ] Implement GitHub read-only repository/commit/workflow inspection through the gateway.
- [ ] Add OAuth or server-side credential connection flows for supported providers.
- [ ] Implement Vercel deployment inspection before any deploy capability.
- [ ] Keep ad spend, publishing, email, SMS, calls and repository writes disabled until explicit scoped approval.
- [ ] Show connected status only after a successful authenticated connection test.

### Phase 5 — release readiness
- [ ] Test on the actual OPPO A6x / Android 16.
- [ ] Verify battery optimization, notification behavior and background restrictions.
- [ ] Build signed release APK/AAB using a private signing key outside GitHub source.
- [ ] Add privacy policy, data handling disclosure, support contact and release notes.
- [ ] Run dependency/security checks and verify clean install, upgrade and uninstall behavior.

## Non-negotiable safeguards
- No hidden microphone, call recording, SMS interception, contact scraping or unrestricted accessibility control.
- No API keys or signing keys in the APK or Git repository.
- Termux binds only to 127.0.0.1; never expose its port to a LAN or public tunnel.
- Approval records are not proof of execution.
- No production deployment, ad spend, message sending, calling or destructive repository action without explicit user approval.
