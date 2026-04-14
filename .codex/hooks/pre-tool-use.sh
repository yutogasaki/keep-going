#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
exec python3 "${repo_root}/scripts/ai/hooks/pre-tool-use-block-destructive.py"
