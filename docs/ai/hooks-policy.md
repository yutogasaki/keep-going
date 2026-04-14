# Hooks Policy

hook は shared implementation と client-specific registration を分ける。

## Canonical Paths

- shared implementation: `scripts/ai/hooks/*`
- Claude registration: `.claude/settings.json`, `.claude/hooks/*`
- Codex registration: `.codex/hooks.json`, `.codex/hooks/*`

## Project Rules

- `.claude/hooks/*` と `.codex/hooks/*` には薄い wrapper だけを置く
- hook 本体の修正は `scripts/ai/hooks/*` を正本にする
- hook が無効でも repo の docs / tasks / memory だけで運用できる構成を保つ

## Current Scope

- Claude Code:
  - session start summary
  - post-edit `tsc`
  - persist migration reminder
  - related test reminder
  - visual QA reminder
- Codex:
  - session start summary
  - Bash の destructive command guardrail

Codex の repo-local hooks は現時点で experimental かつ `PreToolUse` / `PostToolUse` が Bash 中心なので、post-edit verify の主導線は repo command と Claude hook に残す。
これは OpenAI Codex docs の current limitations に基づく運用判断。

Reference:

- OpenAI Codex hooks: <https://developers.openai.com/codex/hooks>
- OpenAI Codex config advanced: <https://developers.openai.com/codex/config-advanced#hooks-experimental>
- Anthropic Claude Code hooks: <https://docs.anthropic.com/en/docs/claude-code/hooks>
