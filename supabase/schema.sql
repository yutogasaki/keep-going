-- KeepGoing Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- 家族メンバー（ローカルの UserProfileStore に対応）
create table family_members (
  id uuid primary key,
  account_id uuid references auth.users not null,
  name text not null,
  class_level text not null default '初級',
  fuwafuwa_birth_date text not null,
  fuwafuwa_type int not null default 0,
  fuwafuwa_cycle_count int not null default 1,
  fuwafuwa_name text,
  past_fuwafuwas jsonb not null default '[]',
  notified_fuwafuwa_stages jsonb not null default '[]',
  daily_target_minutes int not null default 10,
  excluded_exercises jsonb not null default '["C01","C02"]',
  required_exercises jsonb not null default '["S01","S02","S07"]',
  consumed_magic_date text,
  consumed_magic_seconds int default 0,
  avatar_url text,
  chibifuwas jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- セッション履歴
create table sessions (
  id uuid primary key,
  account_id uuid references auth.users not null,
  date text not null,
  started_at text not null,
  total_seconds int not null,
  exercise_ids jsonb not null default '[]',
  skipped_ids jsonb not null default '[]',
  user_ids jsonb not null default '[]',
  created_at timestamptz default now()
);

-- カスタムエクササイズ
create table custom_exercises (
  id text not null,
  account_id uuid references auth.users not null,
  name text not null,
  sec int not null,
  emoji text not null default '🏋️',
  has_split boolean default false,
  creator_id text,
  created_at timestamptz default now(),
  primary key (id, account_id)
);

-- メニューグループ
create table menu_groups (
  id text not null,
  account_id uuid references auth.users not null,
  name text not null,
  emoji text not null default '📋',
  description text,
  exercise_ids jsonb not null default '[]',
  is_preset boolean default false,
  creator_id text,
  created_at timestamptz default now(),
  primary key (id, account_id)
);

-- アプリ設定（アカウントごと1レコード）
create table app_settings (
  account_id uuid primary key references auth.users,
  onboarding_completed boolean default false,
  sound_volume real default 1.0,
  tts_enabled boolean default true,
  bgm_enabled boolean default true,
  haptic_enabled boolean default true,
  notifications_enabled boolean default false,
  notification_time text default '21:00',
  suspended boolean default false,
  updated_at timestamptz default now()
);

-- チャレンジ（先生が作成する月間チャレンジ）
create table challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  exercise_id text not null,
  target_count int not null,
  start_date text not null,
  end_date text not null,
  created_by text not null,
  reward_fuwafuwa_type int not null,
  class_levels text[] not null default '{}',
  created_at timestamptz default now()
);

-- チャレンジ達成記録
create table challenge_completions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges not null,
  account_id uuid references auth.users not null,
  member_id uuid not null,
  completed_at timestamptz default now(),
  unique(challenge_id, account_id, member_id)
);

-- 公開メニュー（メニュー共有機能）
create table public_menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null,
  description text,
  exercise_ids jsonb not null default '[]',
  author_name text not null,
  account_id uuid references auth.users not null,
  download_count int default 0,
  created_at timestamptz default now()
);

-- インデックス
create index idx_family_members_account on family_members (account_id);
create index idx_sessions_account on sessions (account_id);
create index idx_sessions_date on sessions (account_id, date);
create index idx_challenges_dates on challenges (start_date, end_date);
create index idx_challenge_completions_account on challenge_completions (account_id);
create index idx_public_menus_downloads on public_menus (download_count desc);

-- RLS
alter table family_members enable row level security;
alter table sessions enable row level security;
alter table custom_exercises enable row level security;
alter table menu_groups enable row level security;
alter table app_settings enable row level security;
alter table challenges enable row level security;
alter table challenge_completions enable row level security;
alter table public_menus enable row level security;

create policy "Users can manage own data" on family_members
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
create policy "Users can manage own data" on sessions
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
create policy "Users can manage own data" on custom_exercises
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
create policy "Users can manage own data" on menu_groups
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
create policy "Users can manage own data" on app_settings
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);

-- challenges: 全ユーザーが読める、先生だけが作成・削除
create policy "Anyone can read challenges" on challenges
  for select using (true);
create policy "Teachers can manage challenges" on challenges
  for all using (is_teacher()) with check (is_teacher());

-- challenge_completions: 自分のデータのみ、先生は全員分を読める
create policy "Users can manage own completions" on challenge_completions
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
create policy "Teachers can read all completions" on challenge_completions
  for select using (is_teacher());

-- public_menus: 全員が読める、自分のだけ書き込み・削除可
create policy "Anyone can read public menus" on public_menus
  for select using (true);
create policy "Users can manage own public menus" on public_menus
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);

-- updated_at 自動更新トリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger family_members_updated_at before update on family_members
  for each row execute function update_updated_at();
create trigger app_settings_updated_at before update on app_settings
  for each row execute function update_updated_at();

-- ─── 先生モード ──────────────────────────────────────

-- 先生判定関数（メールアドレスをここで変更する）
create or replace function is_teacher()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select email from auth.users where id = auth.uid()) = any(array[
      'yu.togasaki@gmail.com',
      'ayami.ballet.studio@gmail.com'
    ]),
    false
  );
$$;

-- 先生は全生徒の family_members を SELECT できる
create policy "Teachers can read all family_members" on family_members
  for select using (is_teacher());

-- 先生は全生徒の sessions を SELECT できる
create policy "Teachers can read all sessions" on sessions
  for select using (is_teacher());

-- ─── RPC関数 ────────────────────────────────────────

-- 公開メニューのダウンロード数をアトミックにインクリメント
create or replace function increment_download_count(menu_id uuid)
returns void as $$
begin
  update public_menus set download_count = download_count + 1 where id = menu_id;
end;
$$ language plpgsql security definer;

-- ─── 開発者モード ────────────────────────────────────

-- 開発者判定関数
create or replace function is_developer()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select email from auth.users where id = auth.uid()) = 'yu.togasaki@gmail.com',
    false
  );
$$;

-- 先生・開発者は app_settings を全アカウント分 SELECT できる
create policy "Teachers can read all app_settings" on app_settings
  for select using (is_teacher());
create policy "Developers can read all app_settings" on app_settings
  for select using (is_developer());
create policy "Developers can read all custom_exercises" on custom_exercises
  for select using (is_developer());
create policy "Developers can read all menu_groups" on menu_groups
  for select using (is_developer());
create policy "Developers can read all challenge_completions" on challenge_completions
  for select using (is_developer());

-- 休止トグル RPC（開発者のみ）
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

-- データ削除 RPC（開発者のみ）
create or replace function delete_account_data(target_account_id uuid)
returns void as $$
begin
  if not is_developer() then
    raise exception 'Unauthorized: only developers can delete account data';
  end if;
  delete from challenge_completions where account_id = target_account_id;
  delete from public_menus where account_id = target_account_id;
  delete from app_settings where account_id = target_account_id;
  delete from menu_groups where account_id = target_account_id;
  delete from custom_exercises where account_id = target_account_id;
  delete from sessions where account_id = target_account_id;
  delete from family_members where account_id = target_account_id;
end;
$$ language plpgsql security definer;

-- 公開メニュー取得 RPC（休止アカウント除外）
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

-- 先生が個別の family_member を削除できる RPC（クリーンアップ用）
create or replace function teacher_delete_family_member(target_member_id uuid)
returns void as $$
begin
  if not is_teacher() then
    raise exception 'Unauthorized: only teachers can delete family members';
  end if;
  delete from family_members where id = target_member_id;
end;
$$ language plpgsql security definer;
