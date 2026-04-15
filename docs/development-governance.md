# KeepGoing Development Governance

この文書は、KeepGoing の日常開発でどのファイルをどう使うかを定義する。
上位原則は `CONSTITUTION.md` を参照すること。

## Control Plane

| 対象 | 役割 | Canonical path |
|------|------|----------------|
| 憲法 | 変わりにくい最上位ルール | `CONSTITUTION.md` |
| エージェント実行ルール | Codex / Claude 向けの短い入口 | `AGENTS.md`, `CLAUDE.md` |
| 共通 agent guide | 入口ファイルが参照する詳細の正本 | `.agents/agent-guide.md` |
| CI verify | push / PR で回る共通検証導線 | `.github/workflows/verify.yml` |
| Active task queue | 今回の実行対象だけを持つ | `.agents/tasks/TASKS.md` |
| Active task detail | 実行中タスクの詳細メモ | `docs/tasks/active/*.md` |
| Done log | 完了した仕事の短い履歴 | `.agents/tasks/DONE.md` |
| Durable memory | 再利用価値が高い決定・罠 | `.agents/memory/durable.md` |
| Product backlog | 中長期タスク、仕様差分、ロードマップ | `docs/tasks/backlog.md` |
| Product terminology | 用語定義の正本 | `docs/wiki/terminology.md` |
| 詳細仕様 | UI / ロジック /運用仕様 | `docs/product/*`, `docs/architecture/*`, `docs/runbooks/*`, `docs/wiki/*`, `docs/adr/*` |
| Skill | 定型ワークフロー | `.agents/skills/*/SKILL.md` |
| Governance check | canonical path / stale path / size / terminology drift の監査 | `scripts/check-governance.mjs` |

## File Roles

### `AGENTS.md`, `CLAUDE.md`, `.agents/agent-guide.md`

- `AGENTS.md` と `CLAUDE.md` は短い入口に保つ。
- 共通の詳細は `.agents/agent-guide.md` だけを更新する。
- read order や共通コマンドを変える時は、shared guide を正本として直し、入口ファイルは参照だけに留める。

### `.agents/tasks/TASKS.md`

- 今すぐ着手する未完了タスクだけを書く。
- `TODO` と `In Progress` 以外を増やさない。
- 各タスクは「何をするか」だけでなく、必要なら完了条件も短く持つ。
- 30 行を超えたら、細かすぎるタスクか backlog 流し込みすぎを疑う。

### `.agents/tasks/DONE.md`

- 仕事の履歴は日単位・テーマ単位で要約する。
- typo 修正や小さな見た目修正を粒度細かく残しすぎない。
- 50 行を超えたら `.agents/tasks/archive/YYYY-MM.md` へ詳細を移し、`DONE.md` は要約と archive 導線だけを残す。

### `.agents/memory/durable.md`

- 次回以降も効くことだけを書く。
- 例: 設計判断、移行時の罠、Sync の危険点、UX の非交渉ルール。
- 書かないもの: 一時的なデバッグ、進行中タスク、解決済みの細かい修正。

### `docs/tasks/backlog.md`

- Product backlog と spec gap の置き場。
- 実行キューではない。
- 長期課題、後回し項目、仕様との差分整理に使う。
- 重くなったら、完了済みの snapshot は `docs/tasks/archive/*.md` へ逃がし、`docs/tasks/backlog.md` は current focus と未完了項目を優先する。

### `docs/tasks/active/*.md`

- 大きい active task の詳細メモ置き場。
- 目的、SSOT、plan、verification、進捗を task ごとに切り出す。
- `.agents/tasks/TASKS.md` の短い実行キューを肥大化させないために使う。

### `.github/workflows/verify.yml`

- `pull_request` と `main` への push で共通 verify を回す。
- 実行順は `lint -> tsc --noEmit -> test -> build` に固定する。
- ローカルの検証導線を変える時は、この workflow とのズレを作らない。

## Task Lifecycle

1. 仕様差分や大きな課題は `docs/tasks/backlog.md` に置く。
2. 大きい active task は必要に応じて `docs/tasks/active/*.md` に詳細を切る。
3. 今回着手するものだけを `.agents/tasks/TASKS.md` に移す。
4. 完了後は `.agents/tasks/DONE.md` に短く残す。
5. 次回も効く判断だけ `.agents/memory/durable.md` に残す。

## Required Skill And Verification Matrix

複数の変更種別にまたがる時は、該当する行を全部満たす。
迷ったら軽いルートではなく、より厳しい検証を選ぶ。

| 変更種別 | 必須 skill / workflow | 最低検証 |
|---------|-----------------------|---------|
| doc only | 必須 skill なし。governance / task / memory を触るなら `governance-audit` | リンク整合性、参照先の重複確認 |
| governance / task / memory / guide 更新 | `governance-audit` | `npm run governance:check`, canonical path / terminology drift 確認 |
| 型・ロジック変更 | `test` | `npx tsc --noEmit`, 対象テスト |
| Zustand persist 変更 | `persist-migration-check` | `types/createState/migrate/test` 更新、必要なら `APP_STATE_VERSION` 更新、migrate テスト、`npx tsc --noEmit` |
| UI/UX 変更 | `visual-qa` | `npx tsc --noEmit`, 対象テスト、desktop/mobile の画面確認、token 利用確認 |
| sync / db 変更 | `test`。スキーマや SQL を触るなら `db` / `sql` も検討 | 単体テスト or mapper テスト、既存データ影響確認 |
| リリース前 | `push` 相当の verify 手順 | `npm run verify` と主要導線の smoke check |
| CI 変更 | `governance-audit` | workflow の対象 branch、実行順、依存 install、既存 script との整合確認 |

### UI / UX 変更の追加ルール

- `visual-qa` は KeepGoing では任意ではなく必須。
- style を触る場合は `src/lib/styles.ts` と既存 CSS 変数を先に確認し、新しい直書き token を増やさない。
- desktop / mobile の両方で主導線を 1 回通してから完了扱いにする。

## Suggested Working Rules

- 変更前に、関連する single source を確認する。
- product concept の名前を触る変更では `docs/wiki/terminology.md` を先に確認し、deprecated 用語を増やさない。
- 変更種別に対応する required skill / verify を最初に宣言してから作業する。
- 最終回答で主張する内容は、検証結果と一致させる。
- Help 文言や設定説明が古くなる変更では、関連文言も同時に更新する。
- 大きいファイルの修正時は、ついでに責務分割可能性も判断する。

## File Size Guardrails

- React page / modal / editor: 500 行超で警戒、700 行超は分割優先
- Hook / util / service: 250-300 行超で責務分離を検討
- `AGENTS.md`, `CLAUDE.md`: 30 行前後の入口に保つ
- `.agents/agent-guide.md`: 120 行前後で収める
- `.agents/skills/*/SKILL.md` を正本にし、`.claude/skills/*` は redirect 以外を置かない
- `TASKS.md`: 30 行超なら整理
- `DONE.md`: 50 行超なら圧縮
- `durable.md`: 40 行超なら整理

## Skill Policy

- 新しい skill を作る条件:
  - 何度も繰り返す
  - 失敗しやすい
  - 手順が比較的固定化できる
- 既存 skill が required route に入っている変更では、省略せずに使う。
- KeepGoing で効果が高い候補:
  - visual QA
  - migration check
  - release check
  - governance cleanup

## Anti-Patterns

- `AGENTS.md` と `CLAUDE.md` に同じ長文を二重記載する
- shared guide ではなく入口ファイル側を正本のように更新する
- task, done, memory, backlog を同じファイルに混在させる
- UI 変更で `visual-qa` と token 確認を省略する
- UI 変更を型チェックだけで完了扱いにする
- state migrate をテストなしで出す
- 既存の canonical path を直さず、別の path を増やして逃げる
