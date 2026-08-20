# Contributing

1. `main`から短命ブランチを作る。
2. UI変更にはアクセシブルネーム、キーボード、390px級表示を含める。
3. 業務ルール変更にはAPI理由コードとADR更新を含める。
4. 本番/実在の予約ID、生年月日、メールをコミット・テスト・Issueに載せない。
5. 依存追加は正確なバージョンを指定し、install lifecycle scriptが必要ならPRで理由と代替案を明示する。
6. `npm run check` を通す。配布候補では `npm run sbom` と `npm run release:evidence` も実行する。
7. PR本文に変更、信頼境界、検証、リスク、デプロイ、ロールバックを記載する。
8. CIが成功し、CODEOWNERSの責任範囲が確認されるまでマージしない。
9. 原則squash mergeとし、配布対象のコミットを一意にする。
