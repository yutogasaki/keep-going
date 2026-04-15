# KeepGoing Shared Agent Guide

このファイルは `AGENTS.md` と `CLAUDE.md` が参照する共通の正本。
入口ファイルは短く保ち、詳細はここだけを更新する。

## Read Order（毎セッション読む）

1. `CONSTITUTION.md`
2. `.agents/tasks/TASKS.md`
3. `.agents/memory/durable.md`

## 必要時に参照

- `docs/index.md` — docs 全体の入口
- `docs/development-governance.md` — 検証マトリックス。UI/DB/persist 変更時に参照
- `docs/tasks/backlog.md` — product backlog。新機能やタスク優先度の議論時に参照
- `docs/ai/contributor-guide.md` — Claude / Codex の bootstrap、adapter、skill 運用

## Product Snapshot

- バレエ教室向けストレッチ・トレーニング管理 PWA
- 子ども向けの `ふわふわ` 育成体験がある
- 保護者の複数ユーザー管理、先生のメニュー管理、Supabase 同期を持つ

## Stack

- React 19 + TypeScript 5.9 + Vite
- Zustand persist + migrate
- inline style + `src/lib/styles.ts` tokens
- Framer Motion
- Supabase
- vite-plugin-pwa

## Commands

```bash
npm run governance:check
npm run ai:setup
npm run ai:doctor
npm run dev
npm run build
npx tsc --noEmit
npm test
npm run lint
npm run verify:quick
npm run verify
```

## Repo Rules

- Active task queue は `.agents/tasks/TASKS.md`
- 完了履歴は `.agents/tasks/DONE.md`
- durable memory は `.agents/memory/durable.md`
- `docs/tasks/backlog.md` は backlog であり、実行キューではない
- UI文言は日本語ハードコードで管理する
- 子ども向け体験では、強い圧より自然な誘導を優先する

## Engineering Rules

- Zustand persist 変更時は `types/createState/migrate/test` をセットで更新
- Zustand persist 変更では `persist-migration-check` を使う
- skill の正本は `.agents/skills/*/SKILL.md` とし、`.claude/skills/*` は redirect のみを置く
- `src/lib/styles.ts` の token を優先し、直書きを増やさない
- UI / UX 変更では `visual-qa` を必須にし、desktop/mobile 確認と token 利用確認を行う
- CI の正本は `.github/workflows/verify.yml` とし、`lint -> tsc --noEmit -> test -> build` を回す
- モーダルは既存の `src/components/Modal.tsx` を優先する
- user-visible な変更は、必要に応じて desktop/mobile の visual QA を行う
- 巨大ファイルは早めに分割する。詳細閾値は `CONSTITUTION.md` を参照
- import は `@/` エイリアスを優先する（`../../../lib/styles` → `@/lib/styles`）
- テストのファクトリ関数は `src/__tests__/fixtures.ts` から import する。新規ファクトリもここに追加する
- Claude の shared context は `CLAUDE.md` import、project plugin、`.claude/hooks/*` で読み込む
- `claude-mem` などの assistant-local memory は補助扱いで、 durable な判断の正本は `.agents/memory/durable.md` のままにする
- 外部 AI skill / plugin の導入と更新は `npm run ai:setup` を正本ルートにする

## Key Paths

- `src/pages/HomeScreen.tsx`
- `src/pages/StretchSession.tsx`
- `src/pages/MenuPage.tsx`
- `src/pages/TeacherDashboard.tsx`
- `src/store/useAppStore.ts`
- `src/store/use-app-store/*`
- `src/lib/sync/*`

## Local Skills

- `audit` — コード品質監査（バグ/型/規約）
- `cleanup` — ガバナンスファイルの肥大化整理
- `db` — DB スキーマ確認
- `fix` — tsc エラー自動修正
- `governance-audit` — ルール遵守・肥大化監査
- `perf` — パフォーマンス計測・バンドル監視
- `persist-migration-check` — Zustand state 変更の安全確認
- `preview` — 開発サーバーでの簡易確認
- `push` — build → commit → push
- `review` — push 前の変更レビュー
- `scaffold` — コンポーネント/ページ生成
- `split` — 大きいファイルの責務分割
- `sql` — DB マイグレーション生成
- `sync-debug` — Sync 状態の可視化・デバッグ
- `test` — テスト実行・生成
- `todo` — タスク管理
- `visual-qa` — desktop/mobile の UI 検証
