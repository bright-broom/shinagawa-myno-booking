# Shinagawa MyNumber Booking

Bright Bloomによる、品川区マイナンバーカード交付予約の「時間から探す」サービスコンセプトです。

現行cesami/OpenReafを公開範囲で調査した結果を、実際に操作できる住民向けフロントと、段階移行できるアーキテクチャ契約へ落とし込んでいます。

## 現在の範囲

- 5会場横断の空き枠検索
- 日付、時間帯、会場フィルター
- 読上げ可能な予約枠とキーボード操作
- デモ本人確認、確認、完了、予約内容表示
- やさしい日本語切替
- レスポンシブ表示
- 合成データのみ。実システムへの送信、予約枠消費、個人情報保存は行わない

## 開発

```bash
npm ci
npm run dev
```

品質確認:

```bash
npm run check
```

この一つのコマンドで、リポジトリ方針、静的解析、厳格な型検査、ビルド後回帰テスト、依存脆弱性、npmレジストリ署名を検証します。CIはさらにsecret履歴スキャン、GitHub Actions設定監査、OSV依存スキャン、SBOM生成、配布物ハッシュ保存を行います。

## 設計資料

- [アーキテクチャ](docs/architecture.md)
- [API契約](docs/api/openapi.yaml)
- [脅威モデル](docs/security-threat-model.md)
- [アクセシビリティ](docs/accessibility.md)
- [運用設計](docs/operations.md)
- [データ・状態モデル](docs/data-and-state-model.md)
- [業務ルールとシステムルール](docs/business-rules.md)
- [全面リプレイス移行ランブック](docs/migration-runbook.md)
- [本番移行判定ゲート](docs/production-readiness.md)
- [リポジトリ・デプロイガードレール](docs/repository-guardrails.md)
- [ADR-0001: Strangler移行](docs/adr/0001-strangler-same-origin-adapter.md)
- [ADR-0002: 予約枠整合性](docs/adr/0002-capacity-consistency.md)

## 重要な境界

これはプロダクト水準のフロントエンド参照実装ですが、現時点ではcesamiの正式APIに接続していません。本番化には、ベンダー合意、合成IDを使う検証環境、正式なavailability/hold/reservation API、セキュリティ審査、個人情報影響評価が必要です。

## Ownership

Designed and engineered by Bright Bloom.
