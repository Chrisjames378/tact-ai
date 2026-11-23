# TACT AI Guardian — architecture

## Device target
Initial target: OPPO A6x (CPH2819), Android/ColorOS. The device profile previously supplied for this project is 8 GB RAM. Runtime capabilities must still be detected on-device; model choice must not assume all RAM is available.

## Architecture
1. Android app (Kotlin + Jetpack Compose): foreground UI, permission education, notification channels, Android-supported diagnostics and approval UI.
2. Agent gateway (Node.js): authenticated task orchestration, model routing, rate limits, audit trail and integration adapters.
3. Model router: cloud reasoning for complex coding/research; optional small on-device model for bounded offline tasks. Never put provider API keys in the APK.
4. Data layer: PostgreSQL for durable records; optional Redis for ephemeral jobs/cache. Encrypt sensitive data in transit and at rest.
5. Integrations: GitHub, email/calendar providers, CloudVault, deployment providers and user-approved communication actions.

## Model routing
- Cloud model: complex reasoning, coding, long-context analysis and tool planning.
- Local model: offline notes, simple classification and limited summarisation only after performance/thermal testing.
- Fallback: if offline or cloud credentials are unavailable, show a clear disconnected state rather than pretending a task completed.

## Background operation
Use WorkManager for deferrable periodic work and foreground services only for user-visible work that meets Android policy. Do not promise unrestricted always-on execution: Android battery optimisation, vendor background limits and runtime permissions apply.

## Communications
- SMS: only through supported Android roles/permissions and user-granted access; use Android's default SMS app role if full SMS handling is a product requirement.
- Notifications: notification-listener access is optional, separately explained and revocable.
- Email: provider OAuth/API integration, with drafts as the default and send action gated by approval.
- Calls: call screening/default-dialer capabilities only where the user explicitly enables the relevant Android role. No covert call recording or unrestricted call control.
- Third-party messaging: use official APIs or Android-supported notification/reply surfaces; do not bypass app protections.

## Safety model
- Observe: low-risk diagnostics and status checks.
- Prepare: create drafts, proposed code changes and proposed plans.
- Execute: external, irreversible, financial, communication and destructive actions require explicit confirmation.
- Emergency stop: disables agent execution and background task scheduling; local emergency controls remain available.

## Delivery sequence
1. Android shell and project structure.
2. Real device diagnostics and permission centre.
3. Authenticated backend and model gateway.
4. Voice interaction and notification controls.
5. GitHub project agent and deployment diagnostics.
6. Approved communication adapters.
7. Battery/background reliability, security and device testing.
