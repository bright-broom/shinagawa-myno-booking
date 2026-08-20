# ADR-0002: Capacity consistency and idempotent writes

- Status: Accepted for proposal
- Date: 2026-08-20

## Context

空き表示と申込確定には時間差がある。最後の1枠、二重クリック、ネットワーク再送、変更時の旧枠解放が競合要因になる。

## Decision

- クライアントへ容量値を信用させず、opaque `slot_id`を使用する。
- 予約確認開始時に期限付きholdを作成する。
- 確定APIはidempotency keyを必須とする。
- hold消費、容量更新、予約作成、outbox作成を1トランザクションにする。
- 変更は新枠確保と旧枠解放を原子的に処理する。
- 取消は状態遷移として記録し、枠再開放を同一トランザクションで行う。

## Consequences

実装は単純なCRUDより複雑になるが、過剰予約と二重予約を防ぎ、障害時の再送を安全にする。
