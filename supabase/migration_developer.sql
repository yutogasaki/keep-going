-- KeepGoing: 開発者ダッシュボード用マイグレーション
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- ─── 開発者判定関数 ─────────────────────────────────
-- NOTE: deploy.sql の正本と同じ user_roles ベース実装に統一
create or replace function is_developer()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1
    from public.user_roles
    where email = lower(coalesce((select email from auth.users where id = auth.uid()), ''))
      and role = 'developer'
  );
$$;

-- ─── app_settings に suspended カラム追加 ──────────────
alter table app_settings add column if not exists suspended boolean default false;

-- ─── 開発者用 RLS ポリシー（全テーブル SELECT 可） ──────
-- ※ family_members, sessions は is_teacher() で既にSELECT可
create policy "Developers can read all app_settings" on app_settings
  for select using (is_developer());
create policy "Developers can read all custom_exercises" on custom_exercises
  for select using (is_developer());
create policy "Developers can read all menu_groups" on menu_groups
  for select using (is_developer());
create policy "Developers can read all challenge_completions" on challenge_completions
  for select using (is_developer());
create policy "Developers can read all challenge_attempts" on challenge_attempts
  for select using (is_developer());

-- 先生も app_settings を読めるようにする（休止フィルタ用）
create policy "Teachers can read all app_settings" on app_settings
  for select using (is_teacher());

-- ─── 休止トグル RPC ───────────────────────────────────
create or replace function suspend_account(target_account_id uuid, is_suspended boolean)
returns void as $$
begin
  if not is_developer() then
    raise exception 'Unauthorized: only developers can suspend accounts';
  end if;
  insert into app_settings (account_id, suspended)
  values (target_account_id, is_suspended)
  on conflict (account_id)
  do update set suspended = is_suspended, updated_at = now();
end;
$$ language plpgsql security definer;

-- ─── データ削除 RPC ───────────────────────────────────
create or replace function delete_account_data(target_account_id uuid)
returns void as $$
begin
  if not is_developer() then
    raise exception 'Unauthorized: only developers can delete account data';
  end if;
  delete from challenge_attempts where account_id = target_account_id;
  delete from challenge_completions where account_id = target_account_id;
  delete from public_menus where account_id = target_account_id;
  delete from app_settings where account_id = target_account_id;
  delete from menu_groups where account_id = target_account_id;
  delete from custom_exercises where account_id = target_account_id;
  delete from sessions where account_id = target_account_id;
  delete from family_members where account_id = target_account_id;
end;
$$ language plpgsql security definer;

-- ─── 公開メニュー取得 RPC（休止アカウント除外） ─────────
-- 一般ユーザーは app_settings を直接読めないため、
-- security definer で JOIN して休止アカウントを除外する
create or replace function fetch_active_public_menus(
  sort_by text default 'download_count',
  max_count int default 10
)
returns setof public_menus as $$
  select pm.* from public_menus pm
  where pm.account_id not in (
    select account_id from app_settings where suspended = true
  )
  order by
    case when sort_by = 'download_count' then pm.download_count end desc nulls last,
    case when sort_by = 'created_at' then extract(epoch from pm.created_at) end desc nulls last
  limit max_count;
$$ language sql security definer stable;
