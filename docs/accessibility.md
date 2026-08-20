# Accessibility acceptance criteria

Target: JIS X 8341-3:2016 / WCAG 2.2 AA.

## Implemented in this concept

- 日本語lang、skip link、可視focus
- 全入力にlabel、型、pattern、inputMode
- 予約枠の日時・会場・残数を含むアクセシブルネーム
- 検索結果件数のlive region
- dialogの名前、説明、Escape、focus return、focus loop
- 色以外の状態表現
- 390px級を含むレスポンシブ表示
- prefers-reduced-motionへの配慮
- やさしい日本語切替

## Production gates

- axe等の自動テストで重大/深刻0件
- キーボードのみで検索→予約→確認→完了できる
- VoiceOver/NVDAの代表シナリオ確認
- 200%拡大、400% reflow
- コントラスト、44px相当のタッチ領域
- エラーを項目と関連付け、先頭エラーへfocus移動
- 予約期限/必要書類を平易な文章と機械可読理由コードで提供
- 高齢者、弱視者、外国人を含む住民テスト
