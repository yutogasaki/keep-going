#!/usr/bin/env python3

import json
import re
import sys


BLOCK_PATTERNS = [
    r"\bgit\s+reset\s+--hard\b",
    r"\bgit\s+checkout\s+--\b",
    r"\bgit\s+clean\s+-fd\b",
    r"\brm\s+-rf\b",
    r"\bsudo\s+rm\b",
]


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    command = payload.get("tool_input", {}).get("command", "")
    for pattern in BLOCK_PATTERNS:
        if re.search(pattern, command):
            json.dump(
                {
                    "decision": "block",
                    "reason": f"Blocked potentially destructive Bash command: {command}",
                },
                sys.stdout,
            )
            sys.stdout.write("\n")
            return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
