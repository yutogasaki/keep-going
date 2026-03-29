# AI Tooling

KeepGoing の AI 開発環境は、repo に共有する文脈と、各アシスタントの補助機能を分けて運用する。

## Canonical Layers

- 共有ルール / stack / task / durable memory の正本は `AGENTS.md`, `CLAUDE.md`, `.agents/agent-guide.md`, `.agents/tasks/TASKS.md`, `.agents/MEMORY.md`
- Claude / Codex の plugin, hook, skill は補助レイヤー。repo の意思決定を置き換えない
- assistant-local memory に残したいだけの情報と、次回以降も共有したい判断は分ける。後者は `.agents/MEMORY.md` に昇格する

## Installed By `npm run ai:setup`

- Claude Code:
  - project plugin `claude-mem@thedotmack`
  - project plugin `ui-ux-pro-max@ui-ux-pro-max-skill`
  - `.claude/hooks/*` 参照型の project hooks
- Codex:
  - `ui-ux-pro-max` skill を `~/.codex/skills/ui-ux-pro-max` へ同期

## Why This Shape

- Claude は project plugin / hook / `CLAUDE.md` import が強い
- Codex は `AGENTS.md` と skill の相性が強い
- `claude-mem` は session continuity を補強するが、team-shared memory の正本にはしない
- `ui-ux-pro-max` は generic design intelligence を補い、KeepGoing 固有の tone / token / governance は repo 側で制御する

## Commands

```bash
npm run ai:setup
npm run ai:doctor
```

`ai:setup` 実行後は Claude / Codex の再起動を推奨する。
