# Security threat model

## Assets

- 交付通知書の予約ID
- 生年月日等の本人確認情報
- 予約日時、会場、連絡先
- 職員資格情報と権限
- 操作履歴、通知履歴、設定マスタ

## Trust boundaries

1. Public browser ↔ edge/WAF
2. Edge ↔ web/API
3. API ↔ cesami/identity source
4. API ↔ notification provider
5. Staff network ↔ staff console
6. Production ↔ backup/analytics

## Priority threats and controls

| Threat | Control |
|---|---|
| 予約IDの総当たり | 高エントロピーID、rate limit、段階的遅延、監視、失敗応答の均一化 |
| 生年月日の低エントロピー | 予約IDを秘密アクセスキーとして扱い、必要に応じOTP/通知を追加 |
| CSRF | SameSite Cookie、CSRF token、Origin/Referer検証 |
| XSS | 出力エスケープ、CSP、依存管理、インラインscript廃止 |
| Clickjacking | `frame-ancestors 'none'` |
| 二重予約/再送 | hold、idempotency key、DB制約、原子トランザクション |
| 職員権限濫用 | 個人ID、最小権限、MFA、監査、定期棚卸し |
| 個人情報ログ漏えい | 構造化redaction、allowlist logging、短い保管期間 |
| 通知誤送信 | outbox、宛先検証、テンプレート版管理、再送監査 |
| サプライチェーン | 正確な依存版、lockfile、lifecycle script無効化、Dependabot、npm署名検証、OSV、SBOM、配布物ハッシュ |
| CIワークフロー改ざん | Actionのcommit SHA固定、最小権限、永続credential無効、zizmor、policy harness |
| secret混入 | ローカル方針検査、履歴全体のGitleaks、公開Issueへの報告禁止 |

## Required validation before production

- 許可された検証環境での脆弱性診断
- SAST、依存スキャン、secret scan
- 認証/認可とrate limitのテスト
- 個人情報影響評価
- インシデント対応訓練
- バックアップ復元試験

現在のCSPはvinextのRSC実行要件により`script-src 'unsafe-inline'`を含みます。実データを扱う前に、nonceまたはhashベースへ移行し、インラインscriptを禁止することを必須ゲートとします。
