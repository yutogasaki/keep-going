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
