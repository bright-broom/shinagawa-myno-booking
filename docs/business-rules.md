# Business rules and system rules

The distinction is contractual: policy owners may change business rules through approved configuration; engineers own invariant system rules. A UI restriction is not treated as policy without a source and owner.

## Business rules

| Rule | Required source/owner | Configuration shape |
|---|---|---|
| How many business days before a visit booking closes | Resident affairs policy owner | calendar-aware cutoff with effective dates |
| Which venues and services are available | Operations owner | venue/service activation periods |
| Holiday, temporary closure and exceptional opening | Venue operations | exception calendar |
| Appointment duration and per-slot capacity | Operations/workforce owner | versioned schedule template and override |
| Required documents and resident eligibility | Legal/policy owner | versioned content and eligibility rule |
| Change/cancellation deadline | Resident affairs policy owner | action-specific cutoff; not assumed equal to booking cutoff |
| Night/weekend availability | Operations owner | schedule template |

## System invariants

- The server is authoritative for eligibility, cutoff and capacity.
- Capacity cannot become negative and one hold cannot be consumed twice.
- A reservation write is atomic, authenticated, authorized, idempotent and audited.
- Identifiers in URLs and responses are opaque and non-enumerable.
- Changes preserve the existing reservation unless the replacement commits.
- Time calculations use `Asia/Tokyo`, a business calendar and explicit inclusive/exclusive boundaries.
- Rule versions and the decision reason code are stored with the resulting reservation.

## Unknowns that block production

The current public HTML does not establish the legal basis, exception hierarchy, exact business-day algorithm, staff override authority, capacity source of truth, retention schedule or vendor integration contract. These require workshops, document evidence and tests with the municipality and incumbent vendor; they must not be inferred from screen behavior.
