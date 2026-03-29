#!/usr/bin/env bash

set -u -o pipefail

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

npx tsc --noEmit 2>&1 | head -20 || true
