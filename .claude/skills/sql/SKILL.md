# /sql - DB マイグレーション生成・適用

引数で変更内容を自然言語で指定する（例: `/sql teacher_item_overrides に color カラム追加`）。

## 手順

1. `supabase/deploy.sql` を読み込んで現在のスキーマを把握
2. 引数の変更内容に基づいてSQLを生成:
   - `ALTER TABLE` / `CREATE TABLE` / `CREATE INDEX` など
   - 既存カラムとの重複チェック（`IF NOT EXISTS` / `DO $ BEGIN ... EXCEPTION WHEN duplicate_column`）
   - 必要なRLSポリシーも生成
3. 生成したSQLをユーザーに表示して確認
4. 確認後、`supabase/deploy.sql` の適切な位置に追記
5. TypeScriptの型定義（`teacherItemOverrides.ts` 等）に反映が必要な場合は対象ファイルも更新

## 注意
- 破壊的変更（DROP, TRUNCATE）は必ず警告を出す
- deploy.sql の既存構造を壊さないように追記する
- カラム追加は冪等な形式（`DO $ BEGIN ... EXCEPTION`）を使う
