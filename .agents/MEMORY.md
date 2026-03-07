# Memory

再利用価値のある決定だけを残す。
一時メモ、進行中タスク、解決済みの細かい修正は書かない。

## UX / Product

- ホームは「ふわふわに会いに行く画面」を壊さない。強い常設 CTA より、状況に応じた軽い促しを優先する。
- 重要な文脈切替は hidden gesture より明示 UI を優先する。

## Engineering

- 永続 state 変更は `types/createState/migrate/test` をセットで扱う。
- user-visible な変更は、必要に応じて desktop/mobile の visual QA を伴う。
- `AGENTS.md` / `CLAUDE.md` は短い入口に保ち、共通の詳細は `.agents/agent-guide.md` に集約する。

## Known Traps

- agent 向け task queue と product backlog を同じファイルに混ぜると、精度と検索性が落ちる。
- `AGENTS.md` と `CLAUDE.md` に長い重複文書を戻すと、shared guide が形骸化してコンテキスト汚染が再発する。
