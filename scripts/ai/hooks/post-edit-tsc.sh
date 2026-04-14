#!/usr/bin/env bash

set -u -o pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

npx tsc --noEmit 2>&1 | head -20 || true
