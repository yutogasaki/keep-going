# KeepGoing Constitution

このファイルは、KeepGoing の開発運用における最上位ルールを定義する。
詳細手順は個別文書に逃がし、このファイルには変わりにくい原則だけを残す。

## 1. Single Source of Truth

- 同じ責務を持つ永続ファイルは 1 つだけを正とする。
- 重複ファイルを作る場合は、自動生成かリダイレクトだけにする。
- 役割の正は次の通り。
  - 憲法: `CONSTITUTION.md`
  - 開発運用: `docs/development-governance.md`
  - Active task queue: `.agents/tasks/TASKS.md`
  - Done log: `.agents/tasks/DONE.md`
  - Durable memory: `.agents/MEMORY.md`
  - Product backlog / spec gap: `docs/tasks.md`

## 2. Durable Context First

- `AGENTS.md` と `CLAUDE.md` は短く保つ。詳細は参照に逃がす。
- 一時的な進捗、調査メモ、実験結果を `MEMORY` に入れない。
- `MEMORY` に残すのは、次回以降も繰り返し役立つ決定・制約・罠だけ。
- `DONE` は履歴の要約だけを残し、作業実況にしない。

## 3. Verification Is Part of the Change

- 実装が終わっても、検証が終わっていなければ完了ではない。
- ユーザー向け変更は、少なくとも `型` と `影響範囲に応じた検証` を伴う。
- UI/UX を変えたら、必要に応じて desktop/mobile の見た目確認まで行う。
- 最終報告で述べる事実は、必ず検証済みでなければならない。

## 4. State, Data, and Migration Safety

- 永続 state を変える場合は `types`, `createState`, `migrate`, `test` をセットで更新する。
- DB / sync / migration 変更は、後方互換と既存データ保護を優先する。
- 高リスク変更は、正常系だけでなく既存データ読込や空状態も確認する。

## 5. UX Guardrails

- このアプリは「子どもに楽しい」「保護者に安全」を両立させる。
- 隠れ操作に依存しすぎず、重要操作は明示 UI を優先する。
- ホームでは、ふわふわ体験を壊す強い圧や義務感を避ける。
- 先生/保護者向け画面は、可愛さより誤操作耐性と意味の明確さを優先する。

## 6. File and Module Boundaries

- 巨大ファイルは速度と精度を落とすため、早めに分割する。
- 目安:
  - React page / modal / editor: 500 行超で分割検討、700 行超は原則分割
  - Hook / service / data mapper: 250-300 行超で責務分離を検討
  - `src/` の任意ファイル: 800 行超は設計負債として優先的に分割計画を立てる
  - `AGENTS.md`, `CLAUDE.md`: 120 行前後を上限目安
  - `TASKS.md`, `DONE.md`, `MEMORY.md`: 肥大化したら整理する

## 7. Skill and Automation Discipline

- Skill は「高頻度で、失敗しやすく、手順が定型化できる作業」にだけ作る。
- Skill は canonical path を参照し、古い運用パスを増やさない。
- Automation / skill の導入は、作業の短縮だけでなく誤り低減に寄与するものを優先する。

## 8. Cleanup Is a Routine, Not an Emergency

- タスク完了後に `DONE` を更新し、必要がなければ `MEMORY` は更新しない。
- 大きな設計判断だけを `MEMORY` または ADR 相当へ残す。
- ドキュメントと運用ファイルは、増やすより先に整理と役割分離を考える。
