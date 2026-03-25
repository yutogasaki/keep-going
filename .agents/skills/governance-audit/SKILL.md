# /governance-audit - ルール・肥大化監査

`npm run governance:check` の結果を起点に、運用ファイルの健全性を確認する。

## 手順

1. `npm run governance:check` を実行する
2. エラーがあれば修正する
3. 自動チェックで拾えない以下を目視確認する:
   - `DONE.md` / `MEMORY.md` / `TASKS.md` の内容の鮮度（古い情報が残っていないか）
   - backlog（`docs/tasks.md`）と active queue（`TASKS.md`）の混在
   - auto-memory と `.agents/MEMORY.md` の重複

## 閾値（governance:check で自動監査）

- `AGENTS.md`, `CLAUDE.md`: 30 行
- `.agents/agent-guide.md`: 120 行
- `TASKS.md`: 30 行 / `DONE.md`: 50 行 / `MEMORY.md`: 40 行
- React page/modal/editor: 500 行 / Hook/service: 300 行
