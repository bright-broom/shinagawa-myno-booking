# Replacement and migration runbook

## Preconditions

1. Data-processing roles, security responsibilities and rollback authority are signed.
2. Source schema, code lists, time semantics, deleted-record behavior and attachment scope are mapped.
3. A non-production cesami interface and synthetic identities exist.
4. Record counts, hashes and business reconciliation queries are approved.
5. Retention, legal hold and post-termination export/deletion obligations are agreed with the incumbent.

## Phased execution

| Phase | Read authority | Write authority | Exit evidence |
|---|---|---|---|
| 0 Discovery | cesami | cesami | signed rule catalogue and data map |
| 1 Shadow read | cesami + new read model | cesami | availability parity by venue/date/reason code |
| 2 New search | new read model | cesami through supported handoff | conversion, error and accessibility evidence |
| 3 Controlled writes | new service | exactly one routed writer | idempotency, capacity and audit reconciliation |
| 4 Full cutover | new service | new service | signed counts, sample verification and rollback window |
| 5 Legacy retirement | archived read-only export | new service | retention evidence and credential revocation |

## Rehearsal and cutover

- Rehearse full-volume export, transform, import and reconciliation at least twice.
- Freeze configuration before the final migration; if a write freeze is impossible, use a documented change-data capture or delta process.
- Normalize encodings, full/half-width characters, invalid dates, duplicate IDs and venue-code history without silently discarding records.
- Reconcile by entity count, status, venue/day totals, orphan checks, capacity totals and deterministic sample hashes.
- Validate outbound notifications in a sink and never send migration test messages to residents.
- Cut DNS/routing only after go/no-go approval; keep observability dashboards and staffed incident roles active.

## Rollback

Rollback is time-bounded and tested. Trigger on unexplained count mismatch, lost confirmed reservations, capacity divergence, authentication failure, audit gaps or critical accessibility failure. Stop writes first, preserve evidence, restore the single authoritative writer, reconcile any accepted transactions, and communicate with staff and residents using pre-approved templates. Never run both platforms as independent writers.

## Decommissioning

Revoke credentials, remove public routes, retain the approved read-only archive, verify backup expiry, obtain vendor deletion evidence and keep the migration decision log. Redirect only non-sensitive public links; never embed reservation identifiers in redirects or analytics.
