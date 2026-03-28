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

## 2026-03-28: みんなで表示の文脈明確化
- `だれでみる？` の badge を `個人を表示中 / 家族N人を表示中` の二層表示にして、現在コンテキストをヘッダーで読み取りやすくした
- selector sheet に `いま見ている対象` と `切り替えると何が変わるか` を追加し、`個人 / みんなで！` の取り違えを減らした

## 2026-03-28: 共通チャレンジエンジンの teacher 側を統一
- teacher challenge の save 正規化を `src/lib/challenges/engine.ts` に寄せ、`rolling / duration -> active_day`、target/dailyCap/window/publish 条件を 1 か所でそろえた
- home / teacher list / API の progress 計算入口を shared adapter 経由に統一し、teacher challenge を `countChallengeProgressFromSessions` へ直接流し込む重複を解消した
- `toChallengeUpdateRow()` で `created_by` を空文字で上書きしないように修正し、challenge adapter のテストを追加した
