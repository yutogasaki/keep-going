# /cleanup - ファイル肥大化整理

永続ファイルの肥大化をチェックし、重要度に基づいて整理する。

## 対象ファイルと整理基準

| ファイル | 整理基準 |
|---------|---------|
| `.agents/tasks/DONE.md` | 重要度。大きな機能追加・設計変更は残す。細かい修正・typo修正は削除候補 |
| `.agents/memory/durable.md` | 重要度。有用なパターン・アーキテクチャ決定は残す。解決済みの一時メモは削除候補 |
| `AGENTS.md` | 短い入口に保ち、詳細は `.agents/agent-guide.md` に集約する |
| `CLAUDE.md` | 短い入口に保ち、詳細は `.agents/agent-guide.md` に集約する |
| `.agents/agent-guide.md` | 入口ファイルが参照する共通の正本。肥大化したら詳細を別の canonical doc へ逃がす |
| `.agents/tasks/TASKS.md` | 完了済みタスクが残っていれば DONE.md に移動 |

## Codex app が重い時

repo governance cleanup と Codex app の local profile cleanup は別物として扱う。
Codex app の active session / log DB / cache 肥大化を疑う時は、まず読み取り専用で確認する。

```bash
npm run ai:codex-maintenance
```

実行結果で巨大な active session や `logs_*.sqlite` が見つかった場合も、Codex app が起動中なら archive / rotate はしない。
重要な thread は handoff doc に要点を逃がし、Codex を終了してから apply する。

```bash
npm run ai:codex-maintenance:apply
```

詳細は `docs/ai/codex-maintenance.md` を参照する。

## 閾値ガイドライン

| ファイル | 警告行数 | アクション |
|---------|---------|-----------|
| TASKS.md | >30行 | 完了タスクをDONE.mdに移動 |
| DONE.md | >50行 | 要約を残し、詳細は `.agents/tasks/archive/YYYY-MM.md` に移す |
| MEMORY.md | >40行 | 解決済みメモ削除 |
| AGENTS.md | >30行 | 入口化できているか見直す |
| CLAUDE.md | >30行 | 入口化できているか見直す |
| .agents/agent-guide.md | >120行 | 共有ガイドの責務分離を検討 |

## 手順

1. 全対象ファイルを読み込む
2. 各ファイルの現在の行数を報告（閾値超過があれば⚠表示）
3. 削除・圧縮候補をリストアップして表示:
   - 各候補について残す/削除の理由を説明
4. **ユーザーの確認を待つ**（自動削除は絶対にしない）
5. 承認されたもののみ実行

## 重要度の判断基準

**残すべきもの:**
- アーキテクチャ決定（例: override は diff のみ保存）
- ユーザーの好み・ワークフロー設定
- 大きな機能追加の記録
- 再発しうる問題の解決策

**削除候補:**
- 解決済みのバグ修正メモ
- 一時的なデバッグ情報
- 細かいtypo修正・コメント追加の完了記録
- 重複した情報
