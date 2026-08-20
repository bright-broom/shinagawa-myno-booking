# Repository and deployment guardrails

## Objective

レビューを人の注意力だけに依存させず、同じ検査をローカル、PR、`main`、定期実行で繰り返す。現在は合成データ専用のデモ境界を守り、本番接続の認可とは分離する。

## Enforced controls

| Layer | Control |
|---|---|
| Source | CODEOWNERS、PR checklist、短命ブランチ、squash merge |
| Runtime | GET/HEADのみ、URL長制限、同一オリジン画像、CSP/HSTS/COOP/CORP、noindex |
| Dependencies | Node/npm固定、正確な依存版、lockfile、install script無効、npm audit/署名検証 |
| CI | token最小権限、credential非永続化、全Actionをcommit SHA固定、zizmor監査 |
| Detection | Gitleaks履歴スキャン、OSV lockfileスキャン、日次Security workflow |
| Evidence | CycloneDX SBOM、配布物ごとのSHA-256、source commitとtree digestの保存 |
| Boundary | 実在予約情報の禁止、現行サービスへのruntime接続文字列をpolicy harnessで拒否 |

`npm run check`は、policy harness、lint、型、ビルド回帰、advisory、registry署名をまとめて実行する。配布候補には続けて`npm run sbom`と`npm run release:evidence`を実行する。

## Release loop

1. `main`からブランチを作り、PRの信頼境界・検証・ロールバックを記載する。
2. CIとSecurityの全jobを成功させ、差分と生成証跡をレビューする。
3. squash mergeし、マージcommitを唯一の配布元とする。
4. 同じcommitをビルドしてサイトversionへ登録し、owner-onlyで公開する。
5. 公開URL、source commit、site version、CI runを記録する。
6. 異常時は直前の正常versionを再公開する。個人情報や予約書込を始めた後は、別途データ整合性ランブックに従う。

## Repository settings

- Actionsは必要なGitHub公式Actionと明示した外部Actionだけを許可し、完全長SHA固定を要求する。
- workflow tokenは既定read-onlyとし、job単位で必要権限だけを追加する。
- Dependabot alertsとsecurity updatesを有効にする。
- merge commit/rebase mergeを無効化し、squash、web sign-off、merged branch自動削除を有効にする。

## Known limitations and exit criteria

このprivateな個人所有リポジトリの現在のGitHubプランでは、protected branch/rulesets、CodeQL、GitHub secret scanning、private artifact attestationを強制できない。独立scannerとpolicy-as-codeは検出と証跡を補うが、管理者の直接pushや失敗CIのマージを技術的には阻止できない。

本番化前にGitHub Pro、またはGitHub Code Security/Secret Protectionを利用できるOrganizationへ移し、次を必須checkとして保護する。

- `CI / verify`
- `Security / secret-history-scan`
- `Security / github-actions-security`
- `Security / osv-lockfile-scan`

さらに2名承認、CODEOWNERS承認、会話解決、linear history、force-push/deletion禁止、署名付きprovenanceを有効化する。リポジトリを公開して制約を回避する変更は、個別の情報公開審査なしには行わない。
