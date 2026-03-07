# Done

重要度の高い履歴だけを残す。
細かい修正は日単位・テーマ単位に要約する。
詳細履歴は `.agents/tasks/archive/YYYY-MM.md` に移す。

## 2026-03-08: agent guide canonical 化と done 圧縮
- `AGENTS.md` / `CLAUDE.md` を短い入口にし、共通の詳細を `.agents/agent-guide.md` へ集約
- `docs/development-governance.md` と governance skill / script を shared guide + done archive 方針へ更新
- 2026-03 の詳細完了履歴を `.agents/tasks/archive/2026-03.md` へ移し、`DONE.md` を要約ログへ圧縮
- `docs/tasks.md` を current focus と未完了 backlog 中心に再編し、履歴 snapshot を `docs/archive/tasks-2026-03.md` へ分離
- `docs/development-governance.md` に required skill / verify matrix を追加し、UI 変更の `visual-qa` 必須化と token 利用確認を明文化
- `.github/workflows/verify.yml` を追加し、`lint -> tsc --noEmit -> test -> build` を PR / main push で自動実行する CI 導線を追加
- `user_roles` テーブルと migration / deploy を追加し、teacher / developer 判定を hardcoded email から Supabase role 判定へ移行

## 2026-03: 月次サマリ
- sync / restore / teacher data まわりの信頼性改善をまとめて実施し、競合解決・restore・初回同期並列化・ページネーションを強化
- menu / editor / session / record 周辺の責務分離と UX 改善を進め、循環依存解消、hook 分割、editor shell 共通化、同日再開、記録正規化、アクセシビリティ、TTS 音量整理を反映
- 2026-03-04 から 2026-03-07 までの詳細履歴は `.agents/tasks/archive/2026-03.md` を参照
