# Codex Maintenance Runbook

Codex app の体感が重くなった時は、まず `~/.codex` の active session と log DB を疑う。
巨大 chat は永続記憶ではなく実行履歴なので、必要な内容は handoff doc に逃がしてから archive する。

## Inspect First

```bash
npm run ai:codex-maintenance
```

この command は読み取り専用で、次を確認する。

- `~/.codex` 全体と root entry のサイズ
- 古い active session 候補
- 大きい `logs_*.sqlite` 候補
- `state_5.sqlite` / `logs_2.sqlite` の `quick_check`
- Codex app が起動中かどうか

## Apply Safely

Codex app が起動中なら、cleanup は実行しない。
DB や active session を app と外部 script から同時に触らないため。

Codex を終了してから実行する。

```bash
npm run ai:codex-maintenance:apply
```

apply mode は削除しない。実行前に `~/.codex/backups/maintenance-*` へ重要ファイルを copy し、対象は archive directory へ移動する。

- 古い active session: `~/.codex/archived_sessions/maintenance-*`
- 大きい log DB: `~/.codex/archived_logs/maintenance-*`

## Options

```bash
node scripts/codex-maintenance.mjs --session-days 14 --log-mb 512
node scripts/codex-maintenance.mjs --codex-home /path/to/.codex
```

## Manual Review Checklist

- 古い thread の重要内容は handoff doc に移したか
- pinned / current として残したい thread が archive 候補に混ざっていないか
- Codex app を完全に終了したか
- apply 後に Codex を再起動して sidebar / history が自然に見えるか
- `npm run ai:codex-maintenance` で active session と large log 候補が減ったか

## Automation Boundary

週次化する場合も、repo の verify や hook では自動実行しない。
この cleanup は個人の Codex home に効く運用なので、週次 automation は個人環境側で `inspect` を通知し、`apply` は人間が Codex を閉じてから実行する。
