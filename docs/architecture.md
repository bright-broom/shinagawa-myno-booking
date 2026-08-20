# Architecture

## 1. Architectural intent

目標は、現行の「1会場×1週間」の画面を、住民の問いである「いつなら受け取れるか」に応えるサービスへ変えることである。

初期段階ではcesamiを予約エンジンとして残し、同一オリジンの新フロントと正式アダプターを追加する。HTMLスクレイピングは採用しない。

## 2. System context

```text
住民 ────────┐
職員/窓口 ───┼─> Booking Experience ─> Booking API/Adapter ─> cesami
コールセンター┘             │                    │
                            ├─> Mail/SMS          ├─> 通知書/進捗連携
                            └─> Observability     └─> Audit log
```

## 3. Target components

| Component | Responsibility | Data classification |
|---|---|---|
| Web experience | 検索、本人確認導線、予約、変更、取消 | 入力中の個人情報 |
| Availability API | 全会場の空き枠、締切、理由コード | 非個人/集計 |
| Identity gateway | 予約IDと本人確認情報の照合 | 個人情報 |
| Reservation service | hold、申込、変更、取消、冪等性 | 個人/予約情報 |
| Rules service | 祝日、締切、会場例外、容量 | 業務設定 |
| Notification service | 完了、変更、取消通知 | 連絡先 |
| Staff console | 代理予約、来場、不来場、例外処理 | 個人/操作履歴 |
| Audit/telemetry | 監査、SLO、障害調査 | 最小化したイベント |

## 4. Request flows

### Availability

1. ブラウザは日付、時間帯、会場を指定する。
2. Adapterは全対象会場の枠を同一スナップショットで取得する。
3. Rules serviceと同じ判定結果を返す。
4. UIは枠ID、時刻、残数区分、予約不可理由を表示する。

### Reservation

1. Identity gatewayが通知書予約IDを照合する。
2. 選択したopaque `slot_id`に短時間のholdを作成する。
3. 確認後、idempotency key付きで予約を確定する。
4. holdからreservationへの遷移、容量更新、監査記録を1トランザクションで確定する。
5. 通知はoutboxから非同期送信する。

### Reschedule

旧枠を先に解放しない。新枠確保と旧枠解放を同一トランザクションで処理し、失敗時は旧予約を維持する。

## 5. Quality attributes

| Attribute | Target |
|---|---|
| Accessibility | JIS X 8341-3:2016 / WCAG 2.2 AA |
| Availability | 月間99.9%以上を初期SLO候補とし、契約で確定 |
| Consistency | 予約容量はstrong consistency。表示は短時間cache可 |
| Privacy | My Numberそのものを取得しない。ログへ個人情報を出さない |
| Performance | 検索p95 1.0秒、予約確定p95 2.0秒を候補 |
| Auditability | 職員/住民/システム操作を相関IDで追跡 |
| Recoverability | RPO/RTOは現行SLAと業務影響分析後に確定 |

## 6. Deployment topology

推奨は同一オリジン配下の段階移行。

```text
https://booking.example.jp/       -> 新フロント
https://booking.example.jp/api/   -> 新Adapter/API
https://booking.example.jp/legacy -> cesami（移行中のみ）
```

これによりCORS、Cookie、CSRF、ブラウザ遷移を制御しやすい。外部公開経路にはWAF、rate limit、構造化アクセスログを置く。

## 7. Migration plan

1. 参照APIと新検索UI
2. 既存申込画面への署名付きhandoff
3. hold/申込API
4. 変更/取消API
5. 職員画面と帳票の移行
6. 旧環境のread-only化と保管期限後の廃止

各段階でfeature flag、shadow read、件数照合、rollback条件を持つ。書込正系は常に1つに限定する。

## 8. Explicit non-goals for this repository

- 実在する予約IDの照合
- cesami HTMLの代理送信/解析
- 本番個人情報の保存
- 予約枠の実消費
- 行政の正式ブランド/公式サイトを装うこと
