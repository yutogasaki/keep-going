#!/usr/bin/env bash

set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

changed_file=$(
  echo "${CLAUDE_FILE_PATHS:-}" \
    | tr ':' '\n' \
    | grep '\.tsx\?$' \
    | grep -v '__tests__' \
    | head -1
)

if [ -z "${changed_file}" ]; then
  exit 0
fi

test_dir="$(dirname "${changed_file}")/__tests__"
base_name="$(basename "${changed_file}" | sed 's/\.tsx\?$//')"
test_file="$(ls "${test_dir}/${base_name}"*.test.ts 2>/dev/null | head -1 || true)"

if [ -n "${test_file}" ]; then
  echo "[Auto Test] ${test_file}"
  npx vitest run "${test_file}" 2>&1 | tail -5 || true
fi
