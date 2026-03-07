# KeepGoing Development Governance

この文書は、KeepGoing の日常開発でどのファイルをどう使うかを定義する。
上位原則は `CONSTITUTION.md` を参照すること。

## Control Plane

| 対象 | 役割 | Canonical path |
|------|------|----------------|
| 憲法 | 変わりにくい最上位ルール | `CONSTITUTION.md` |
| エージェント実行ルール | Codex / Claude 向けの短い入口 | `AGENTS.md`, `CLAUDE.md` |
| Active task queue | 今回の実行対象だけを持つ | `.agents/tasks/TASKS.md` |
| Done log | 完了した仕事の短い履歴 | `.agents/tasks/DONE.md` |
| Durable memory | 再利用価値が高い決定・罠 | `.agents/MEMORY.md` |
| Product backlog | 中長期タスク、仕様差分、ロードマップ | `docs/tasks.md` |
| 詳細仕様 | UI / ロジック /運用仕様 | `docs/*.md` |
| Skill | 定型ワークフロー | `.agents/skills/*/SKILL.md` |

## File Roles

### `.agents/tasks/TASKS.md`

- 今すぐ着手する未完了タスクだけを書く。
- `TODO` と `In Progress` 以外を増やさない。
- 各タスクは「何をするか」だけでなく、必要なら完了条件も短く持つ。
- 30 行を超えたら、細かすぎるタスクか backlog 流し込みすぎを疑う。

### `.agents/tasks/DONE.md`

- 仕事の履歴は日単位・テーマ単位で要約する。
- typo 修正や小さな見た目修正を粒度細かく残しすぎない。
- 50 行を超えたら圧縮・月別アーカイブを検討する。

### `.agents/MEMORY.md`

- 次回以降も効くことだけを書く。
- 例: 設計判断、移行時の罠、Sync の危険点、UX の非交渉ルール。
- 書かないもの: 一時的なデバッグ、進行中タスク、解決済みの細かい修正。

### `docs/tasks.md`

- Product backlog と spec gap の置き場。
- 実行キューではない。
- 長期課題、後回し項目、仕様との差分整理に使う。

## Task Lifecycle

1. 仕様差分や大きな課題は `docs/tasks.md` に置く。
2. 今回着手するものだけを `.agents/tasks/TASKS.md` に移す。
3. 完了後は `.agents/tasks/DONE.md` に短く残す。
4. 次回も効く判断だけ `.agents/MEMORY.md` に残す。

## Verification Matrix

| 変更種別 | 最低検証 |
|---------|---------|
| doc only | リンク整合性、参照先の重複確認 |
| 型・ロジック変更 | `npx tsc --noEmit`, 対象テスト |
| Zustand persist 変更 | `types/createState/migrate/test` 更新 + migrate テスト |
| UI/UX 変更 | `npx tsc --noEmit`, 対象テスト、desktop/mobile の画面確認 |
| sync / db 変更 | 単体テスト or mapper テスト、既存データ影響確認 |
| リリース前 | `npm run verify` と主要導線の smoke check |

## Suggested Working Rules

- 変更前に、関連する single source を確認する。
- 最終回答で主張する内容は、検証結果と一致させる。
- Help 文言や設定説明が古くなる変更では、関連文言も同時に更新する。
- 大きいファイルの修正時は、ついでに責務分割可能性も判断する。

## File Size Guardrails

- React page / modal / editor: 500 行超で警戒、700 行超は分割優先
- Hook / util / service: 250-300 行超で責務分離を検討
- `AGENTS.md`, `CLAUDE.md`: 120 行前後で収める
- `TASKS.md`: 30 行超なら整理
- `DONE.md`: 50 行超なら圧縮
- `MEMORY.md`: 40 行超なら整理

## Skill Policy

- 新しい skill を作る条件:
  - 何度も繰り返す
  - 失敗しやすい
  - 手順が比較的固定化できる
- KeepGoing で効果が高い候補:
  - visual QA
  - migration check
  - release check
  - governance cleanup

## Anti-Patterns

- `AGENTS.md` と `CLAUDE.md` に同じ長文を二重記載する
- task, done, memory, backlog を同じファイルに混在させる
- UI 変更を型チェックだけで完了扱いにする
- state migrate をテストなしで出す
- 既存の canonical path を直さず、別の path を増やして逃げる
