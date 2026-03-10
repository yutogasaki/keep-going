-- teacher_item_overrides に display_mode_override カラムを追加
-- deploy.sql に含まれているが、deploy.sql 全体を再実行しなくても
-- このファイル単体で適用可能。
--
-- Supabase SQL Editor で実行してください。

do $$ begin
  alter table teacher_item_overrides add column display_mode_override text;
exception when duplicate_column then null;
end $$;
