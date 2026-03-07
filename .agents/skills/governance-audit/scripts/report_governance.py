#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]

CHECKS = [
    ("AGENTS.md", 120),
    ("CLAUDE.md", 120),
    (".agents/tasks/TASKS.md", 30),
    (".agents/tasks/DONE.md", 50),
    (".agents/MEMORY.md", 40),
]

STALE_PATTERNS = [
    ".Codex/tasks",
    ".claude/tasks",
    ".Codex/launch.json",
]


def line_count(path: Path) -> int:
    if not path.exists():
        return -1
    return path.read_text(encoding="utf-8").count("\n") + 1


def find_stale_refs() -> list[tuple[str, int, str]]:
    results: list[tuple[str, int, str]] = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in {"node_modules", ".git", "dist"} for part in path.parts):
            continue
        if path.suffix not in {".md", ".ts", ".tsx", ".js", ".json"}:
            continue

        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            continue

        for index, line in enumerate(lines, start=1):
            for pattern in STALE_PATTERNS:
                if pattern in line:
                    results.append((str(path.relative_to(ROOT)), index, pattern))
    return results


print("Governance file sizes:")
for relative_path, threshold in CHECKS:
    path = ROOT / relative_path
    count = line_count(path)
    status = "missing" if count < 0 else ("warn" if count > threshold else "ok")
    count_label = "missing" if count < 0 else str(count)
    print(f"- {relative_path}: {count_label} lines (threshold {threshold}) [{status}]")

stale_refs = find_stale_refs()
print("\nStale path references:")
if not stale_refs:
    print("- none")
else:
    for relative_path, line_no, pattern in stale_refs:
        print(f"- {relative_path}:{line_no} -> {pattern}")
