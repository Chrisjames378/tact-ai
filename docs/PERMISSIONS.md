# Permission and approval matrix

| Capability | Android access | Default |
|---|---|---|
| Battery/storage diagnostics | Public system APIs | On, read-only |
| Notifications | POST_NOTIFICATIONS | Ask at first use |
| Speech input | RECORD_AUDIO | Ask at first use |
| Notification content | Notification listener special access | Off until explicitly enabled |
| SMS inbox/send | SMS permissions and/or default SMS role | Off; explain role requirements |
| Calls/call screening | Default dialer or call-screening role where applicable | Off |
| Contacts/calendar | Runtime permissions or provider OAuth | Off until needed |
| Microphone in background | Foreground service and visible notification; platform policy | Off unless actively started |
| External email/message send | Provider authorization | Draft first; approval required |
| GitHub writes/deployments | Scoped OAuth/token via backend | Preview first; approval required |
| Database migrations/deletions | Backend scoped credentials | Explicit approval required |

## Approval classes
- Automatic: read-only health checks, local summaries and reminders.
- Confirm: send/reply, code writes, deployments, account setting changes.
- Strong confirmation: payments, destructive data changes, production migrations, credential rotation.

All approvals must show the proposed action, destination/target, important data being sent or changed, and a cancel option. Record a non-secret audit event for each execution result.
