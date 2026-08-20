# Data and state model

## Canonical entities

| Entity | Stable key | Important attributes | Owner |
|---|---|---|---|
| Venue | `venue_id` | name, address, accessibility, active period | Rules service |
| Service | `service_id` | procedure type, duration, eligibility | Rules service |
| Slot | opaque `slot_id` | venue, service, start/end, capacity, version | Reservation service |
| Hold | `hold_id` | slot, resident session, expiry, status | Reservation service |
| Reservation | non-sequential `public_id` + internal ID | slot, status, version, contact reference | Reservation service |
| Resident session | random session ID | verified subject reference, assurance, expiry | Identity gateway |
| Rule | `rule_id` + version | booking window, closure, capacity override | Rules service |
| Audit event | append-only event ID | actor, action, target, result, correlation ID | Audit store |

My Number itself is outside the model. Birth date and notification-booking ID are verification inputs and must not be copied into telemetry, analytics or URL parameters.

## Reservation state machine

```text
AVAILABLE -> HELD -> CONFIRMED -> COMPLETED
              |          |  \-> RESCHEDULED (terminal history record)
              |          \----> CANCELLED
              \---------------> EXPIRED

CONFIRMED ---------------------> NO_SHOW
```

- `HELD` has a short server-side expiry and never guarantees confirmation after expiry.
- Capacity changes and state changes share one atomic transaction.
- Reschedule confirms the new slot before releasing the old slot within the same transaction boundary.
- Every write requires an idempotency key and returns the previously committed result on replay.
- Public availability is derived from authoritative capacity, active holds and rules at a stated `as_of` time.

## Retention and deletion

The municipality must approve a records schedule before production. Separate operational reservation retention, statutory audit retention, security-log retention and anonymized service analytics. Deletion must cover primary data, replicas, search indexes, notification vendors and backup expiry, with evidence retained without resident payloads.
