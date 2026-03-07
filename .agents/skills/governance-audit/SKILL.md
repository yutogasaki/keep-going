# /governance-audit - ルール・task・memory・肥大化監査

KeepGoing の開発運用が canonical path からズレていないか、ファイルが肥大化していないかを確認する。
`CONSTITUTION.md` と `docs/development-governance.md` に沿って監査する。

## 使うタイミング

- ルールや task 運用を見直したい
- `AGENTS.md` / `CLAUDE.md` / `TASKS.md` / `DONE.md` / `MEMORY.md` を整理したい
- コンテキスト汚染や重複文書が気になる

## 手順

1. まず `scripts/report_governance.py` を実行する
2. canonical path を確認する
   - `CONSTITUTION.md`
   - `docs/development-governance.md`
   - `.agents/tasks/TASKS.md`
   - `.agents/tasks/DONE.md`
   - `.agents/MEMORY.md`
   - `docs/tasks.md`
3. 役割重複や stale path がないか検索する
4. 行数と内容の両面で肥大化を確認する
5. 次の観点で findings を出す
   - single source 違反
   - backlog と active queue の混在
   - durable memory でないものの蓄積
   - agent guide の重複
   - stale skill / stale script / stale path
6. 修正する場合は、まず canonical path へ寄せる

## KeepGoing の閾値

- `AGENTS.md`, `CLAUDE.md`: 120 行前後
- `TASKS.md`: 30 行超で整理検討
- `DONE.md`: 50 行超で圧縮検討
- `MEMORY.md`: 40 行超で整理検討

## 出力の形

- findings を優先度順に出す
- 次に `今すぐ直すもの / 後でよいもの` を分ける
- 修正後は canonical path と残るリスクを短く報告する
