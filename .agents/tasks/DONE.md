# Done

重要度の高い履歴だけを残す。
細かい修正は日単位・テーマ単位に要約する。
詳細履歴は `.agents/tasks/archive/YYYY-MM.md` に移す。

## 2026-03: 月次サマリ
- sync / restore / teacher data まわりの信頼性改善をまとめて実施し、競合解決・restore・初回同期並列化・ページネーションを強化
- menu / editor / session / record 周辺の責務分離と UX 改善を進め、循環依存解消、hook 分割、editor shell 共通化、同日再開、記録正規化、TTS 音量整理を反映
- ホームの情報設計を `チャレンジ -> 先生のメニュー -> みんなのメニュー` に整理し、先生/みんなカードと詳細シートを追加
- チャレンジ拡張: 先生チャレンジとじぶんチャレンジの共通基盤、再挑戦導線、参加者履歴化
- BGM 設定と音量バランス調整、developer dashboard 整理導線強化
- agent guide canonical 化、governance check CI 導入、skill 正本整備
- 詳細は `.agents/tasks/archive/2026-03.md` を参照

## 2026-03-25: 環境構築整備
- `.nvmrc` + `package.json engines` + CI の `node-version-file` で Node 22 をローカル/CI 統一
- `README.md` にセットアップ手順書、`supabase/README.md` に DB マイグレーション手順を追加
- 既存テスト失敗 3 件を修正（menu item UUID 化、challenge enrollment joinedAt 追加への対応）

## 2026-04-25: 開発環境アップデート
- Node 24 LTS / npm 11 をローカル・CI の基準にし、`vite` を直接 devDependency として明示
- npm audit 0 件化、Actions v6 化、`typecheck` / `verify:ci` 導線、EditorConfig / VS Code 推奨拡張を追加
- menu reorder key の index 依存を解消し、全体 verify と E2E smoke を通過
- teacher challenge list / target form / AuthContext / teacher content / db / challenge display/API / public menu publish / personal challenge / store migrate/createState の責務分離を進め、challenge/public menu/sync mapper テストも分割。menu exercise hook の不要依存 warning を解消

## 2026-03-28: みんなで表示の文脈明確化
- `だれでみる？` の badge を `個人を表示中 / 家族N人を表示中` の二層表示にして、現在コンテキストをヘッダーで読み取りやすくした
- selector sheet に `いま見ている対象` と `切り替えると何が変わるか` を追加し、`個人 / みんなで！` の取り違えを減らした

## 2026-03-28: 共通チャレンジエンジンの teacher 側を統一
- teacher challenge の save 正規化を `src/lib/challenges/engine.ts` に寄せ、`rolling / duration -> active_day`、target/dailyCap/window/publish 条件を 1 か所でそろえた
- home / teacher list / API の progress 計算入口を shared adapter 経由に統一し、teacher challenge を `countChallengeProgressFromSessions` へ直接流し込む重複を解消した
- `toChallengeUpdateRow()` で `created_by` を空文字で上書きしないように修正し、challenge adapter のテストを追加した

## 2026-03-28: ふわふわ会話のトーンガイド整理
- `docs/fuwafuwa-tone-guide.md` を追加し、`褒めない / 評価しない / 指示しない / 回数に触れない` の原則と `daily / ambient / afterglow / milestone` ごとの OK/NG 例を整理した
- `fuwafuwaSpeechGuidance.ts` に再会文脈と afterglow 文脈の helper を切り出し、`また会えた / ひさしぶり / セッション直後 / みんなで！` の返答を増やした
- `getUserEventSpeech()` に visit recency を通し、 solo / family の afterglow copy が再訪文脈まで反映されるようにした

## 2026-03-28: ホームの safe area / CTA visual QA を完了
- `ScreenScaffold` と `HomeScreen` の下端余白調整後、`390x844` のモバイル幅で first view を確認し、`ふわふわ -> チャレンジ導入` の視線誘導が崩れていないことを確認した
- Playwright で scroll container / footer / FAB の幾何を確認し、終端時の最下部 CTA (`種目も見る`) が FAB top より約 32px、footer top より約 55px 上に収まることを確認した
- 開発中の HMR で出ていた `useAuth must be used within AuthProvider` は context singleton 化で再現しなくなり、ホーム QA の継続を妨げる不安定さを解消した
