# AI Contributor Guide

KeepGoing の AI 開発環境は、shared canonical docs と client-specific adapter を分けて運用する。

## Canonical Layers

- `docs/` は長期知識の正本
- `.agents/` は Claude Code / Codex 共有の運用正本
- `.claude/` は Claude Code 専用 adapter
- `.codex/` は Codex 専用 adapter

shared で保持する正本:

- `AGENTS.md`, `CLAUDE.md`
- `.agents/agent-guide.md`
- `.agents/tasks/TASKS.md`, `.agents/tasks/DONE.md`, `.agents/tasks/BLOCKED.md`
- `.agents/memory/durable.md`
- `.agents/skills/*/SKILL.md`

## Client Adapters

- Claude Code:
  - `CLAUDE.md` import を入口にする
  - `.claude/settings.json` で project plugins / hooks を有効化する
  - `.claude/hooks/*` は wrapper とし、共有ロジックは `scripts/ai/hooks/*` に寄せる
- Codex:
  - `AGENTS.md` を入口にする
  - `.codex/config.toml` で project-scoped config を持つ
  - `.codex/hooks.json` は repo-local hook registration
  - shared skills は `.agents/skills/*` を使い、`.codex/skills` に複製しない

## Installed By `npm run ai:setup`

- Claude Code project plugins:
  - `claude-mem@thedotmack`
  - `ui-ux-pro-max@ui-ux-pro-max-skill`
- Codex home skill:
  - `~/.codex/skills/ui-ux-pro-max`

repo-local adapter files (`.claude/*`, `.codex/*`, `scripts/ai/hooks/*`) は versioned で持つため、`ai:setup` は主に外部 plugin / skill の導入を担当する。

## Why This Shape

- Claude は `CLAUDE.md` import と project hooks の相性が強い
- Codex は `AGENTS.md`, `.agents/skills`, project-scoped `.codex/config.toml` の相性が強い
- durable な判断は assistant-local memory ではなく `.agents/memory/durable.md` に残す
- shared hook logic を `scripts/ai/hooks/*` に寄せると、client ごとの差分を registration に限定できる

## Commands

```bash
npm run ai:setup
npm run ai:doctor
npm run governance:check
```

関連資料:

- `docs/ai/hooks-policy.md`
- `docs/development-governance.md`
