-- KeepGoing Supabase Schema
-- Empty database bootstrap only.
-- 既存の Supabase プロジェクトには流さないでください。
-- 既存環境の更新は `supabase/deploy.sql` か個別 migration を使います。

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
  id text primary key,
  account_id uuid references auth.users not null,
  date text not null,
  started_at text not null,
  total_seconds int not null,
  exercise_ids jsonb not null default '[]',
  planned_exercise_ids jsonb not null default '[]',
  skipped_ids jsonb not null default '[]',
  user_ids jsonb not null default '[]',
  source_menu_id text,
  source_menu_source text check (source_menu_source in ('preset', 'teacher', 'custom', 'public')),
  source_menu_name text,
  created_at timestamptz default now()
);

-- カスタムエクササイズ
create table custom_exercises (
  id text not null,
  account_id uuid references auth.users not null,
  name text not null,
  sec int not null,
  emoji text not null default '🏋️',
  placement text not null default 'stretch' check (placement in ('prep', 'stretch', 'core', 'barre', 'ending', 'rest')),
  has_split boolean default false,
  creator_id text,
  description text,
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

-- ユーザー権限（teacher / developer）
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email)),
  role text not null check (role in ('teacher', 'developer')),
  created_at timestamptz default now(),
  unique (email, role)
);

-- チャレンジ（先生が作成する月間チャレンジ）
create table challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  description text,
  challenge_type text not null default 'exercise',
  exercise_id text not null,
  target_exercise_id text,
  target_menu_id text,
  menu_source text,
  target_count int not null,
  daily_cap int not null default 1,
  count_unit text not null default 'exercise_completion',
  start_date text not null,
  end_date text not null,
  window_type text not null default 'calendar',
  goal_type text not null default 'total_count',
  window_days int,
  required_days int,
  daily_minimum_minutes int,
  publish_mode text not null default 'seasonal',
  publish_start_date text,
  publish_end_date text,
  created_by text not null,
  reward_fuwafuwa_type int not null,
  reward_kind text not null default 'medal',
  reward_value int not null default 0,
  tier text not null default 'big',
  icon_emoji text,
  class_levels text[] not null default '{}',
  created_at timestamptz default now(),
  constraint challenges_type_check check (challenge_type in ('exercise', 'menu', 'duration')),
  constraint challenges_menu_source_check check (menu_source is null or menu_source in ('teacher', 'preset')),
  constraint challenges_count_unit_check check (count_unit in ('exercise_completion', 'menu_completion')),
  constraint challenges_daily_cap_check check (daily_cap >= 1),
  constraint challenges_window_type_check check (window_type in ('calendar', 'rolling')),
  constraint challenges_goal_type_check check (goal_type in ('total_count', 'active_day')),
  constraint challenges_window_days_check check (window_days is null or window_days >= 1),
  constraint challenges_required_days_check check (required_days is null or required_days >= 1),
  constraint challenges_daily_minimum_minutes_check check (daily_minimum_minutes is null or daily_minimum_minutes >= 1),
  constraint challenges_publish_mode_check check (publish_mode in ('seasonal', 'always_on')),
  constraint challenges_publish_window_check check (
    publish_mode = 'always_on'
    or (
      publish_start_date is not null
      and publish_end_date is not null
      and publish_end_date >= publish_start_date
    )
  ),
  constraint challenges_reward_kind_check check (reward_kind in ('star', 'medal')),
  constraint challenges_reward_value_check check (reward_value >= 0),
  constraint challenges_tier_check check (tier in ('small', 'big'))
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

create table challenge_enrollments (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges not null,
  account_id uuid references auth.users not null,
  member_id uuid not null,
  joined_at timestamptz not null default now(),
  effective_start_date text not null,
  effective_end_date text not null,
  created_at timestamptz default now(),
  constraint challenge_enrollments_window_check check (effective_end_date >= effective_start_date),
  unique(challenge_id, account_id, member_id)
);

create table personal_challenges (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references auth.users not null,
  member_id uuid not null,
  title text not null,
  summary text,
  description text,
  challenge_type text not null default 'exercise',
  target_exercise_id text,
  target_menu_id text,
  menu_source text,
  target_count int not null default 1,
  daily_cap int not null default 1,
  count_unit text not null default 'exercise_completion',
  goal_type text not null default 'active_day',
  window_days int not null,
  required_days int,
  started_at timestamptz not null default now(),
  effective_start_date text not null,
  effective_end_date text not null,
  status text not null default 'active',
  icon_emoji text,
  reward_granted_at timestamptz,
  completed_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint personal_challenges_type_check check (challenge_type in ('exercise', 'menu')),
  constraint personal_challenges_menu_source_check check (menu_source is null or menu_source in ('teacher', 'preset', 'custom', 'public')),
  constraint personal_challenges_count_unit_check check (count_unit in ('exercise_completion', 'menu_completion')),
  constraint personal_challenges_goal_type_check check (goal_type in ('total_count', 'active_day')),
  constraint personal_challenges_target_count_check check (target_count >= 1),
  constraint personal_challenges_daily_cap_check check (daily_cap >= 1),
  constraint personal_challenges_window_days_check check (window_days >= 1),
  constraint personal_challenges_required_days_check check (required_days is null or required_days >= 1),
  constraint personal_challenges_status_check check (status in ('active', 'completed', 'ended_manual', 'ended_expired')),
  constraint personal_challenges_window_check check (effective_end_date >= effective_start_date),
  constraint personal_challenges_target_check check (
    (challenge_type = 'exercise' and target_exercise_id is not null and target_menu_id is null and menu_source is null)
    or
    (challenge_type = 'menu' and target_exercise_id is null and target_menu_id is not null and menu_source is not null)
  )
);

-- 公開メニュー（メニュー共有機能）
create table public_menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null,
  description text,
  exercise_ids jsonb not null default '[]',
  custom_exercise_data jsonb default '[]',
  author_name text not null,
  account_id uuid references auth.users not null,
  download_count int default 0,
  created_at timestamptz default now()
);

-- インデックス
create index idx_family_members_account on family_members (account_id);
create index idx_sessions_account on sessions (account_id);
create index idx_sessions_date on sessions (account_id, date);
create index idx_user_roles_role on user_roles (role);
create index idx_challenges_dates on challenges (start_date, end_date);
create index idx_challenge_completions_account on challenge_completions (account_id);
create index idx_challenge_enrollments_account on challenge_enrollments (account_id);
create index idx_personal_challenges_account on personal_challenges (account_id);
create index idx_personal_challenges_member_status on personal_challenges (member_id, status);
create index idx_public_menus_downloads on public_menus (download_count desc);

-- RLS
alter table family_members enable row level security;
alter table sessions enable row level security;
alter table custom_exercises enable row level security;
alter table menu_groups enable row level security;
alter table app_settings enable row level security;
alter table user_roles enable row level security;
alter table challenges enable row level security;
alter table challenge_completions enable row level security;
alter table challenge_enrollments enable row level security;
alter table personal_challenges enable row level security;
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

create policy "Users can manage own enrollments" on challenge_enrollments
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
create policy "Teachers can read all enrollments" on challenge_enrollments
  for select using (is_teacher());

create policy "Users can manage own personal challenges" on personal_challenges
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);

-- public_menus: 全員が読める、自分のだけ書き込み・削除可
create policy "Anyone can read public menus" on public_menus
  for select using (true);
create policy "Users can manage own public menus" on public_menus
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);

insert into user_roles (email, role)
values
  ('yu.togasaki@gmail.com', 'teacher'),
  ('yu.togasaki@gmail.com', 'developer'),
  ('ayami.ballet.studio@gmail.com', 'teacher')
on conflict (email, role) do nothing;

create or replace function is_teacher()
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
      and role = 'teacher'
  );
$$;

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

create policy "Developers can manage user_roles" on user_roles
  for all using (is_developer()) with check (is_developer());

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

-- 先生/開発者が個別の family_member を削除できる RPC（クリーンアップ用）
create or replace function teacher_delete_family_member(target_member_id uuid)
returns void as $$
begin
  if not is_teacher() and not is_developer() then
    raise exception 'Unauthorized: only teachers or developers can delete family members';
  end if;
  delete from family_members where id = target_member_id;
end;
$$ language plpgsql security definer;

-- ─── 先生モード追加テーブル ──────────────────────────────

-- 先生メニュー設定（種目・メニューのクラス別ステータス）
create table teacher_menu_settings (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,
  item_type text not null check (item_type in ('exercise', 'menu_group')),
  class_level text not null,
  status text not null default 'optional' check (status in ('required', 'optional', 'excluded', 'hidden')),
  created_by text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (item_id, item_type, class_level)
);

alter table teacher_menu_settings enable row level security;
create policy "Anyone can read teacher_menu_settings" on teacher_menu_settings
  for select using (true);
create policy "Teachers can manage teacher_menu_settings" on teacher_menu_settings
  for all using (is_teacher()) with check (is_teacher());
create index idx_teacher_menu_settings_class on teacher_menu_settings (class_level, item_type);

create trigger teacher_menu_settings_updated_at
  before update on teacher_menu_settings
  for each row execute function update_updated_at();

-- 先生が作ったオリジナル種目
create table teacher_exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sec int not null default 30,
  emoji text not null default '🌸',
  placement text not null default 'stretch' check (placement in ('prep', 'stretch', 'core', 'barre', 'ending', 'rest')),
  has_split boolean default false,
  description text,
  class_levels text[] not null default '{}',
  visibility text not null default 'public' check (visibility in ('public', 'class_limited', 'teacher_only')),
  focus_tags text[] not null default '{}',
  recommended boolean not null default false,
  recommended_order int,
  display_mode text not null default 'standard_inline' check (display_mode in ('teacher_section', 'standard_inline')),
  created_by text not null,
  created_at timestamptz default now()
);

alter table teacher_exercises enable row level security;
create policy "Anyone can read teacher_exercises" on teacher_exercises
  for select using (true);
create policy "Teachers can manage teacher_exercises" on teacher_exercises
  for all using (is_teacher()) with check (is_teacher());

-- 先生が作ったセットメニュー
create table teacher_menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '📋',
  description text,
  exercise_ids jsonb not null default '[]',
  class_levels text[] not null default '{}',
  visibility text not null default 'public' check (visibility in ('public', 'class_limited', 'teacher_only')),
  focus_tags text[] not null default '{}',
  recommended boolean not null default false,
  recommended_order int,
  display_mode text not null default 'teacher_section' check (display_mode in ('teacher_section', 'standard_inline')),
  created_by text not null,
  created_at timestamptz default now()
);

alter table teacher_menus enable row level security;
create policy "Anyone can read teacher_menus" on teacher_menus
  for select using (true);
create policy "Teachers can manage teacher_menus" on teacher_menus
  for all using (is_teacher()) with check (is_teacher());

-- 先生の種目/メニュー名・説明の上書き
create table teacher_item_overrides (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,
  item_type text not null check (item_type in ('exercise', 'menu_group')),
  name_override text,
  description_override text,
  emoji_override text,
  sec_override int,
  has_split_override boolean,
  exercise_ids_override text[],
  created_by text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (item_id, item_type)
);

alter table teacher_item_overrides enable row level security;
create policy "Anyone can read teacher_item_overrides" on teacher_item_overrides
  for select using (true);
create policy "Teachers can manage teacher_item_overrides" on teacher_item_overrides
  for all using (is_teacher()) with check (is_teacher());

create trigger teacher_item_overrides_updated_at
  before update on teacher_item_overrides
  for each row execute function update_updated_at();

-- ─── 公開種目 ────────────────────────────────────────

create table public_exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sec int not null default 30,
  emoji text not null default '🌸',
  placement text not null default 'stretch' check (placement in ('prep', 'stretch', 'core', 'barre', 'ending', 'rest')),
  has_split boolean default false,
  description text,
  author_name text not null,
  account_id uuid references auth.users not null,
  download_count int default 0,
  created_at timestamptz default now()
);

alter table public_exercises enable row level security;
create policy "Anyone can read public_exercises" on public_exercises
  for select using (true);
create policy "Users can manage own public_exercises" on public_exercises
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
create index idx_public_exercises_downloads on public_exercises (download_count desc);

-- 種目ダウンロード重複防止
create table exercise_downloads (
  exercise_id uuid not null references public_exercises(id) on delete cascade,
  account_id uuid not null,
  downloaded_at timestamptz default now(),
  primary key (exercise_id, account_id)
);

alter table exercise_downloads enable row level security;
create policy "Users can manage own exercise_downloads" on exercise_downloads
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);

-- ─── ダウンロード重複防止 ──────────────────────────────

-- メニューダウンロード記録テーブル
create table menu_downloads (
  menu_id uuid not null references public_menus(id) on delete cascade,
  account_id uuid not null,
  downloaded_at timestamptz default now(),
  primary key (menu_id, account_id)
);

alter table menu_downloads enable row level security;
create policy "Users can manage own downloads" on menu_downloads
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);

-- ダウンロードカウントを重複なしでインクリメントする RPC
create or replace function try_increment_download_count(target_menu_id uuid, downloader_account_id uuid)
returns boolean as $$
declare
  was_inserted boolean;
begin
  insert into menu_downloads (menu_id, account_id)
  values (target_menu_id, downloader_account_id)
  on conflict do nothing;

  get diagnostics was_inserted = row_count;

  if was_inserted then
    update public_menus set download_count = download_count + 1 where id = target_menu_id;
    return true;
  end if;

  return false;
end;
$$ language plpgsql security definer;
