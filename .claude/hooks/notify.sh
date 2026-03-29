#!/usr/bin/env bash

set -euo pipefail

title="${1:-Claude Code}"
message="${2:-Claude Code notification}"
sound="${3:-Ping}"

if ! command -v osascript >/dev/null 2>&1; then
  exit 0
fi

osascript - "$title" "$message" "$sound" <<'APPLESCRIPT' >/dev/null 2>&1 || true
on run argv
  set notificationTitle to item 1 of argv
  set notificationMessage to item 2 of argv
  set notificationSound to item 3 of argv
  display notification notificationMessage with title notificationTitle sound name notificationSound
end run
APPLESCRIPT
