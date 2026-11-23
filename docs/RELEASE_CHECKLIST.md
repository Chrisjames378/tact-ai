# TACT AI Guardian — release checklist

## Before device testing
- [ ] GitHub Actions gateway tests pass.
- [ ] Android debug APK build passes.
- [ ] APK artifact downloaded from the latest successful run.
- [ ] Gateway is deployed over HTTPS with a strong APP_TOKEN.
- [ ] Provider API key stored only in server environment secrets.
- [ ] Termux companion remains optional and loopback-only.

## OPPO A6x test
- [ ] Install debug APK and launch without crash.
- [ ] Confirm all five navigation tabs render.
- [ ] Save gateway URL and token; restart app and confirm settings persist.
- [ ] Send a test prompt and confirm response.
- [ ] Turn off network and verify a clear offline error without losing history.
- [ ] Clear conversation and verify local history is removed.
- [ ] Check battery and available storage values against Android Settings.
- [ ] Enable/disable scheduled checks and confirm WorkManager state.
- [ ] Start Termux service and test localhost health; stop it and verify app remains usable.
- [ ] Refresh approvals; record approve/deny and verify no external action runs.
- [ ] Check Android permission prompts and deny optional permissions to verify graceful behavior.

## Before public release
- [ ] Test on physical OPPO A6x, Android 16.
- [ ] Add privacy policy and data retention details.
- [ ] Configure production signing securely.
- [ ] Verify app version, package ID and release notes.
- [ ] Review dependency licenses and security scan results.
- [ ] Do not describe untested features as live or connected.
