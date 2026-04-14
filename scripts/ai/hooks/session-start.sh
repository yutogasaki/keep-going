#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "${repo_root}"

printf '%s\n' '--- Git Status ---'
git status --short || true

printf '\n%s\n' '--- Unpushed Commits ---'
git log --oneline @{u}..HEAD 2>/dev/null || echo 'No upstream set'

printf '\n%s\n' '--- Pending Tasks ---'
grep '^- \[ \]' .agents/tasks/TASKS.md 2>/dev/null || echo 'No pending tasks'

done_count=$(grep -c '^- \[x\]' .agents/tasks/TASKS.md 2>/dev/null || echo 0)
if [ "${done_count}" -gt 10 ]; then
  printf '\n%s\n' "[Warn] TASKS.md に完了タスク${done_count}件 - /cleanup 推奨"
fi
