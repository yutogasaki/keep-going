#!/usr/bin/env bash

set -euo pipefail

if echo "${CLAUDE_FILE_PATHS:-}" | grep -q 'src/pages/.*\.tsx\|src/components/.*\.tsx'; then
  echo '[Visual QA] UI コンポーネントが変更されました。user-visible な変更がある場合は /visual-qa を実行してください。'
fi
