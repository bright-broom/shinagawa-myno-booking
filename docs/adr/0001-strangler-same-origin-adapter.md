# ADR-0001: Same-origin Strangler Adapter

- Status: Accepted for proposal
- Date: 2026-08-20

## Context

現行cesamiはフォームPOSTとHTML再描画を中心とし、公開JSON APIは確認できない。全会場横断検索を別ドメインのSPAから実現すると、CORS、host-only Cookie、画面nonce、仕様変更への依存が発生する。

## Decision

新フロントと正式Adapterを現行と同一オリジンに配置し、機能単位でStrangler移行する。Adapterはベンダー承認済みの内部API/サービス層だけを使用し、HTMLスクレイピングやDB直書きを行わない。

## Consequences

- 既存投資を残しながらUXを先行改善できる。
- API契約と業務ルール共通化が必要になる。
- ベンダー協力、契約上の改修権、テスト環境が前提になる。
- Adapterが恒久的な複雑性にならないよう、廃止条件をロードマップに置く。
