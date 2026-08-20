# Operations and reliability

## Candidate SLOs

| Indicator | Candidate objective |
|---|---|
| Resident availability | 99.9% monthly |
| Availability search | p95 < 1.0s |
| Reservation confirmation | p95 < 2.0s |
| Successful write ratio | 99.95%, excluding business-rule rejection |
| Notification handoff | 99% within 2 minutes |

Final targets require traffic and business impact data.

## Observability

- Correlation ID from edge to reservation/outbox/audit
- RED metrics: rate, errors, duration
- Slot conflict, hold expiry, idempotent replay, notification retry metrics
- No reservation ID, birth date, email in normal logs
- Synthetic monitoring with dedicated non-production identities
- Separate security alerts for repeated login failures and unusual staff access

## Runbooks

1. Availability API degradation: serve short-lived last-known data as read-only and disable booking writes.
2. Reservation database degradation: fail closed; do not confirm a reservation without committed record.
3. Notification outage: keep reservation committed and retry outbox; show confirmation reference on screen.
4. cesami integration outage: stop new writes, preserve existing reservations, activate call-center notice.
5. Capacity discrepancy: freeze affected slot, reconcile counts, retain audit evidence.

## Release

- PRで`npm run check`、Gitleaks、zizmor、OSVをすべて成功させる
- `main`でSBOMと配布物ハッシュを生成し、対象commitと結び付けて保管する
- デプロイ先へ渡すのはマージ済み`main`の同一commitだけとし、公開後にURLとcommitを記録する
- Feature flags by function and venue
- Canary for read flows; controlled cohort for writes
- Schema changes expand/contract
- Automated smoke checks with synthetic data
- Rollback criteria and named incident commander
- No simultaneous write authority in old and new systems

デモのロールバックは、直前に成功したサイトversionを再公開する。将来の書込系は、アプリだけを戻してもデータを元に戻さないため、expand/contract方式、前方互換、機能フラグ停止、照合手順を先に用意する。
