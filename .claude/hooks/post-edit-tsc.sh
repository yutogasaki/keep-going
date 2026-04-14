#!/usr/bin/env bash

set -u -o pipefail

repo_root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
exec "${repo_root}/scripts/ai/hooks/post-edit-tsc.sh" "$@"
