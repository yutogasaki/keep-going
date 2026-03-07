# KeepGoing - Claude Guide

## Read Order

1. `CONSTITUTION.md`
2. `docs/development-governance.md`
3. `.agents/tasks/TASKS.md`
4. `.agents/MEMORY.md`
5. `docs/tasks.md`（product backlog / spec gap）

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
- durable memory は `.agents/MEMORY.md`
- `docs/tasks.md` は backlog であり、実行キューではない
- UI文言は日本語ハードコードで管理する
- 子ども向け体験では、強い圧より自然な誘導を優先する

## Engineering Rules

- Zustand persist 変更時は `types/createState/migrate/test` をセットで更新
- `src/lib/styles.ts` の token を優先し、直書きを増やさない
- モーダルは既存の `src/components/Modal.tsx` を優先する
- user-visible な変更は、必要に応じて desktop/mobile の visual QA を行う
- 巨大ファイルは早めに分割する。詳細閾値は `CONSTITUTION.md` を参照

## Key Paths

- `src/pages/HomeScreen.tsx`
- `src/pages/StretchSession.tsx`
- `src/pages/MenuPage.tsx`
- `src/pages/TeacherDashboard.tsx`
- `src/store/useAppStore.ts`
- `src/store/use-app-store/*`
- `src/lib/sync/*`

## Local Skills

- `audit`
- `cleanup`
- `db`
- `fix`
- `governance-audit`
- `persist-migration-check`
- `preview`
- `push`
- `review`
- `scaffold`
- `sql`
- `test`
- `todo`
- `visual-qa`
