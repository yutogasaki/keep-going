#!/usr/bin/env bash

set -euo pipefail

if echo "${CLAUDE_FILE_PATHS:-}" | grep -q 'use-app-store/\(types\|createState\|migrate\)'; then
  echo '[Zustand Persist] types/createState/migrate が変更されました。persist-migration-check の実行を推奨します。'
fi
