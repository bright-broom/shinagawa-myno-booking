# Production readiness gates

This repository is a demonstrator. Production is permitted only when every mandatory gate has an accountable owner, dated evidence and explicit approval.

| Gate | Minimum evidence | Current state |
|---|---|---|
| Product/policy | signed journeys, rule catalogue, content ownership | Not started |
| Architecture | approved target, integration contract, failure modes, cost model | Proposed |
| Privacy/legal | DPIA/PIA, records schedule, processor agreements | Not started |
| Security | threat-model review, SAST/SCA/secret scan, authorized assessment, incident exercise | Automated baseline implemented; independent assessment pending |
| Accessibility | JIS/WCAG expert audit plus assistive-technology and resident testing | Partial automated/design only |
| Reliability | measured SLOs, RTO/RPO, capacity test, backup restore, runbooks | Candidate targets only |
| Data migration | two rehearsals, reconciliation sign-off, tested rollback | Not started |
| Operations | support model, monitoring, escalation, status communications | Proposed |
| Delivery | segregated environments, protected branch, approvals, signed release provenance | Vercel Preview/Production、policy-as-code、release evidence、本番smokeを実装。protected branch/attestationは現行planでは未強制 |
| Procurement/vendor | supported interface, SLA, exit/export and deletion terms | Not started |

## Recommended candidate objectives

- Availability SLO: 99.9% monthly; error-budget policy pauses risky releases when exhausted.
- Reservation durability: RPO 0 for acknowledged writes through synchronous multi-zone persistence.
- Service recovery: RTO 60 minutes for booking writes; read-only service or public status within 15 minutes.
- Search p95 under 1 second and reservation confirmation p95 under 2 seconds at agreed peak load.
- Recovery restore test at least twice yearly and before material storage changes.

These values are architecture candidates, not commitments. Business impact analysis, traffic forecasts and procurement terms must ratify them.
