# /audit - コード品質監査

コードベース全体を走査し、バグ・コードスメル・規約違反を検出する。

## 手順

1. `npx tsc --noEmit` でコンパイルエラー確認
2. 以下のカテゴリで検出:

### バグリスク
- `getExerciseById` / `getExercisesByClass` のみで種目解決 → カスタム/先生種目が漏れる箇所
- `EXERCISES.find` / `EXERCISES.filter` の直接使用 → 同上
- `calculateTotalSeconds` のビルトイン専用使用
- IndexedDB/Supabase操作のエラーハンドリング欠如

### 型安全性
- `as any` / `as never` の使用箇所
- `@ts-ignore` / `@ts-expect-error`
- 明示的な型定義のない関数パラメータ

### 規約違反
- 300行超のファイル → 分割候補
- `createPortal` 直接使用 → `<Modal>` コンポーネント不使用
- ハードコードされた色/フォント → `src/lib/styles.ts` トークン不使用
- `console.log` の残留（`lib/` 内の `console.warn/error` は許容）

3. 検出結果をカテゴリ別・重要度順にリスト表示
4. 修正提案を提示（自動修正はしない）

## 引数
- なし: 全カテゴリ監査
- カテゴリ名（`bug` / `type` / `style`）: 指定カテゴリのみ
