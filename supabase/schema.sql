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
  updated_at timestamptz default now()
);

-- インデックス
create index idx_family_members_account on family_members (account_id);
create index idx_sessions_account on sessions (account_id);
create index idx_sessions_date on sessions (account_id, date);

-- RLS
alter table family_members enable row level security;
alter table sessions enable row level security;
alter table custom_exercises enable row level security;
alter table menu_groups enable row level security;
alter table app_settings enable row level security;

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
