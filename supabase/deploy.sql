-- KeepGoing Supabase Deploy Script
-- 冪等（何回実行しても安全）
-- Supabase SQL Editor にコピペして実行してください

-- ─── 権限テーブル ────────────────────────────────────────

create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email)),
  role text not null check (role in ('teacher', 'developer')),
  created_at timestamptz default now(),
  unique (email, role)
);

create index if not exists idx_user_roles_role on user_roles (role);

alter table user_roles enable row level security;

-- NOTE: 初期ロール割り当て。本番メールアドレスを含む。
-- 追加のロール管理は Supabase ダッシュボードの user_roles テーブルで行う。
insert into user_roles (email, role)
values
  ('yu.togasaki@gmail.com', 'teacher'),
  ('yu.togasaki@gmail.com', 'developer'),
  ('ayami.ballet.studio@gmail.com', 'teacher')
on conflict (email, role) do nothing;

-- ─── 関数定義 ──────────────────────────────────────────

-- updated_at 自動更新トリガー関数
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 先生判定関数
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

-- 開発者判定関数
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

-- ─── カラム型修正 ─────────────────────────────────────

-- sessions.id を uuid → text に変更（ローカルの session-* 形式IDと互換性を持たせる）
do $$ begin
  alter table sessions alter column id type text using id::text;
exception when others then null;
end $$;

-- ─── カラム追加（既に存在する場合はスキップ） ─────────

-- app_settings に suspended カラム追加
do $$ begin
  alter table app_settings add column suspended boolean default false;
exception when duplicate_column then null;
end $$;

-- app_settings に updated_at カラム追加
do $$ begin
  alter table app_settings add column updated_at timestamptz default now();
exception when duplicate_column then null;
end $$;

-- family_members に avatar_url カラム追加
do $$ begin
  alter table family_members add column avatar_url text;
exception when duplicate_column then null;
end $$;

-- family_members に chibifuwas カラム追加
do $$ begin
  alter table family_members add column chibifuwas jsonb not null default '[]';
exception when duplicate_column then null;
end $$;

create table if not exists web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references auth.users on delete cascade not null,
  endpoint text not null,
  p256dh_key text not null,
  auth_key text not null,
  expiration_time bigint,
  notification_time text not null default '21:00',
  time_zone text not null default 'UTC',
  user_agent text,
  last_sent_local_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (endpoint)
);

create index if not exists idx_web_push_subscriptions_account on web_push_subscriptions (account_id);
create index if not exists idx_web_push_subscriptions_schedule on web_push_subscriptions (notification_time, time_zone);

alter table web_push_subscriptions enable row level security;

-- sessions に menu challenge 用メタデータ追加
do $$ begin
  alter table sessions add column planned_exercise_ids jsonb not null default '[]';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table sessions add column planned_items jsonb not null default '[]';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table sessions add column source_menu_id text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table sessions add column source_menu_source text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table sessions add column source_menu_name text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table sessions add constraint sessions_source_menu_source_check
    check (source_menu_source is null or source_menu_source in ('preset', 'teacher', 'custom', 'public'));
exception when duplicate_object then null;
end $$;

-- public_menus に custom_exercise_data カラム追加
do $$ begin
  alter table public_menus add column custom_exercise_data jsonb default '[]';
exception when duplicate_column then null;
end $$;

-- public_menus に inline menu item 用カラム追加
do $$ begin
  alter table public_menus add column menu_items jsonb not null default '[]';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public_menus add column source_menu_group_id text;
exception when duplicate_column then null;
end $$;

-- menu_groups に inline menu item 用カラム追加
do $$ begin
  alter table menu_groups add column menu_items jsonb not null default '[]';
exception when duplicate_column then null;
end $$;

-- challenges に v2a カラム追加
do $$ begin
  alter table challenges add column summary text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column description text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column challenge_type text not null default 'exercise';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column target_exercise_id text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column target_menu_id text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column menu_source text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column daily_cap int not null default 1;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column count_unit text not null default 'exercise_completion';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column window_type text not null default 'calendar';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column goal_type text not null default 'total_count';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column window_days int;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column required_days int;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column daily_minimum_minutes int;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column publish_mode text not null default 'seasonal';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column publish_start_date text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column publish_end_date text;
exception when duplicate_column then null;
end $$;

update challenges
set
  publish_start_date = coalesce(publish_start_date, start_date),
  publish_end_date = coalesce(publish_end_date, end_date)
where publish_mode = 'seasonal';

do $$ begin
  alter table challenges drop constraint challenges_type_check;
exception when undefined_object then null;
end $$;

do $$ begin
  alter table challenges add constraint challenges_type_check
    check (challenge_type in ('exercise', 'menu', 'duration'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table challenges add column reward_kind text not null default 'medal';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column reward_value int not null default 0;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column tier text not null default 'big';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add column icon_emoji text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table challenges add constraint challenges_window_type_check
    check (window_type in ('calendar', 'rolling'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table challenges add constraint challenges_goal_type_check
    check (goal_type in ('total_count', 'active_day'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table challenges add constraint challenges_window_days_check
    check (window_days is null or window_days >= 1);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table challenges add constraint challenges_required_days_check
    check (required_days is null or required_days >= 1);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table challenges add constraint challenges_daily_minimum_minutes_check
    check (daily_minimum_minutes is null or daily_minimum_minutes >= 1);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table challenges add constraint challenges_publish_mode_check
    check (publish_mode in ('seasonal', 'always_on'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table challenges add constraint challenges_publish_window_check
    check (
      publish_mode = 'always_on'
      or (
        publish_start_date is not null
        and publish_end_date is not null
        and publish_end_date >= publish_start_date
      )
    );
exception when duplicate_object then null;
end $$;

create table if not exists challenge_enrollments (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges not null,
  account_id uuid references auth.users not null,
  member_id uuid not null,
  joined_at timestamptz not null default now(),
  effective_start_date text not null,
  effective_end_date text not null,
  created_at timestamptz default now(),
  constraint challenge_enrollments_window_check check (effective_end_date >= effective_start_date),
  unique (challenge_id, account_id, member_id)
);

create index if not exists idx_challenge_enrollments_account on challenge_enrollments (account_id);

alter table challenge_enrollments enable row level security;

create table if not exists challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges not null,
  account_id uuid references auth.users not null,
  member_id uuid not null,
  attempt_no int not null,
  joined_at timestamptz not null default now(),
  effective_start_date text not null,
  effective_end_date text not null,
  status text not null default 'active',
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint challenge_attempts_window_check check (effective_end_date >= effective_start_date),
  constraint challenge_attempts_status_check check (status in ('active', 'completed', 'expired')),
  unique (challenge_id, account_id, member_id, attempt_no)
);

create index if not exists idx_challenge_attempts_account on challenge_attempts (account_id);

alter table challenge_attempts enable row level security;

create table if not exists challenge_reward_grants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges not null,
  account_id uuid references auth.users not null,
  member_id uuid not null,
  granted_at timestamptz default now(),
  unique (challenge_id, account_id, member_id)
);

create index if not exists idx_challenge_reward_grants_account on challenge_reward_grants (account_id);

alter table challenge_reward_grants enable row level security;

do $$ begin
  create policy "Users can manage own enrollments" on challenge_enrollments
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers can read all enrollments" on challenge_enrollments
    for select using (is_teacher());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can manage own challenge attempts" on challenge_attempts
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers can read all challenge attempts" on challenge_attempts
    for select using (is_teacher());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can manage own challenge reward grants" on challenge_reward_grants
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers can read all challenge reward grants" on challenge_reward_grants
    for select using (is_teacher());
exception when duplicate_object then null;
end $$;

insert into challenge_reward_grants (challenge_id, account_id, member_id, granted_at)
select challenge_id, account_id, member_id, completed_at
from challenge_completions
on conflict (challenge_id, account_id, member_id) do nothing;

insert into challenge_attempts (
  challenge_id,
  account_id,
  member_id,
  attempt_no,
  joined_at,
  effective_start_date,
  effective_end_date,
  status,
  completed_at,
  created_at,
  updated_at
)
select
  e.challenge_id,
  e.account_id,
  e.member_id,
  1,
  e.joined_at,
  e.effective_start_date,
  e.effective_end_date,
  case
    when c.challenge_id is not null then 'completed'
    when e.effective_end_date < current_date::text then 'expired'
    else 'active'
  end,
  c.completed_at,
  e.created_at,
  coalesce(c.completed_at, e.created_at, now())
from challenge_enrollments e
left join challenge_completions c
  on c.challenge_id = e.challenge_id
 and c.account_id = e.account_id
 and c.member_id = e.member_id
on conflict (challenge_id, account_id, member_id, attempt_no) do nothing;

insert into challenge_attempts (
  challenge_id,
  account_id,
  member_id,
  attempt_no,
  joined_at,
  effective_start_date,
  effective_end_date,
  status,
  completed_at,
  created_at,
  updated_at
)
select
  c.challenge_id,
  c.account_id,
  c.member_id,
  1,
  c.completed_at,
  ch.start_date,
  ch.end_date,
  'completed',
  c.completed_at,
  c.completed_at,
  c.completed_at
from challenge_completions c
join challenges ch on ch.id = c.challenge_id
left join challenge_attempts a
  on a.challenge_id = c.challenge_id
 and a.account_id = c.account_id
 and a.member_id = c.member_id
where a.id is null
on conflict (challenge_id, account_id, member_id, attempt_no) do nothing;

create table if not exists personal_challenges (
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

create index if not exists idx_personal_challenges_account on personal_challenges (account_id);
create index if not exists idx_personal_challenges_member_status on personal_challenges (member_id, status);

alter table personal_challenges enable row level security;

do $$ begin
  create policy "Users can manage own personal challenges" on personal_challenges
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;

-- ─── テーブル作成（RPCより先に） ──────────────────────

-- ダウンロード記録テーブル
create table if not exists menu_downloads (
  menu_id uuid not null references public_menus(id) on delete cascade,
  account_id uuid not null,
  downloaded_at timestamptz default now(),
  primary key (menu_id, account_id)
);

alter table menu_downloads enable row level security;

do $$ begin
  create policy "Users can manage own downloads" on menu_downloads
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can manage own push subscriptions" on web_push_subscriptions
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;

drop trigger if exists web_push_subscriptions_updated_at on web_push_subscriptions;
create trigger web_push_subscriptions_updated_at
  before update on web_push_subscriptions
  for each row execute function update_updated_at();

-- ─── RLSポリシー（安全に作成） ────────────────────────

do $$ begin
  create policy "Developers can manage user_roles" on user_roles
    for all using (is_developer()) with check (is_developer());
exception when duplicate_object then null;
end $$;

-- 先生: 全family_membersをSELECT
do $$ begin
  create policy "Teachers can read all family_members" on family_members
    for select using (is_teacher());
exception when duplicate_object then null;
end $$;

-- 先生: 全sessionsをSELECT
do $$ begin
  create policy "Teachers can read all sessions" on sessions
    for select using (is_teacher());
exception when duplicate_object then null;
end $$;

-- 先生: 全app_settingsをSELECT
do $$ begin
  create policy "Teachers can read all app_settings" on app_settings
    for select using (is_teacher());
exception when duplicate_object then null;
end $$;

-- 先生: 全challenge_completionsをSELECT
do $$ begin
  create policy "Teachers can read all completions" on challenge_completions
    for select using (is_teacher());
exception when duplicate_object then null;
end $$;

-- 開発者: 全app_settingsをSELECT
do $$ begin
  create policy "Developers can read all app_settings" on app_settings
    for select using (is_developer());
exception when duplicate_object then null;
end $$;

-- 開発者: 全custom_exercisesをSELECT
do $$ begin
  create policy "Developers can read all custom_exercises" on custom_exercises
    for select using (is_developer());
exception when duplicate_object then null;
end $$;

-- 開発者: 全menu_groupsをSELECT
do $$ begin
  create policy "Developers can read all menu_groups" on menu_groups
    for select using (is_developer());
exception when duplicate_object then null;
end $$;

-- 開発者: 全challenge_completionsをSELECT
do $$ begin
  create policy "Developers can read all challenge_completions" on challenge_completions
    for select using (is_developer());
exception when duplicate_object then null;
end $$;

-- 開発者: 全challenge_reward_grantsをSELECT
do $$ begin
  create policy "Developers can read all challenge_reward_grants" on challenge_reward_grants
    for select using (is_developer());
exception when duplicate_object then null;
end $$;

-- 開発者: 全challenge_attemptsをSELECT
do $$ begin
  create policy "Developers can read all challenge_attempts" on challenge_attempts
    for select using (is_developer());
exception when duplicate_object then null;
end $$;

-- ─── RPC関数 ──────────────────────────────────────────

-- ダウンロード数インクリメント（旧版、フォールバック用）
create or replace function increment_download_count(menu_id uuid)
returns void as $$
begin
  update public_menus set download_count = download_count + 1 where id = menu_id;
end;
$$ language plpgsql security definer;

-- 休止トグル（開発者のみ）
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

-- データ削除（開発者のみ）
create or replace function delete_account_data(target_account_id uuid)
returns void as $$
begin
  if not is_developer() then
    raise exception 'Unauthorized: only developers can delete account data';
  end if;
  delete from exercise_downloads where account_id = target_account_id;
  delete from public_exercises where account_id = target_account_id;
  delete from menu_downloads where account_id = target_account_id;
  delete from challenge_reward_grants where account_id = target_account_id;
  delete from challenge_attempts where account_id = target_account_id;
  delete from challenge_completions where account_id = target_account_id;
  delete from public_menus where account_id = target_account_id;
  delete from web_push_subscriptions where account_id = target_account_id;
  delete from app_settings where account_id = target_account_id;
  delete from menu_groups where account_id = target_account_id;
  delete from custom_exercises where account_id = target_account_id;
  delete from sessions where account_id = target_account_id;
  delete from family_members where account_id = target_account_id;
end;
$$ language plpgsql security definer;

-- 公開メニュー取得（休止アカウント除外）
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

-- メンバー個別削除（先生 or 開発者）
create or replace function teacher_delete_family_member(target_member_id uuid)
returns void as $$
begin
  if not is_teacher() and not is_developer() then
    raise exception 'Unauthorized: only teachers or developers can delete family members';
  end if;
  delete from family_members where id = target_member_id;
end;
$$ language plpgsql security definer;

-- 重複なしダウンロードカウント
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

-- ─── 先生メニュー設定テーブル ────────────────────────

-- クラス別の必須/おまかせ/除外設定
create table if not exists teacher_menu_settings (
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

do $$ begin
  create policy "Anyone can read teacher_menu_settings" on teacher_menu_settings
    for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers can manage teacher_menu_settings" on teacher_menu_settings
    for all using (is_teacher()) with check (is_teacher());
exception when duplicate_object then null;
end $$;

do $$ begin
  create index idx_teacher_menu_settings_class
    on teacher_menu_settings (class_level, item_type);
exception when duplicate_table then null;
end $$;

drop trigger if exists teacher_menu_settings_updated_at on teacher_menu_settings;
create trigger teacher_menu_settings_updated_at
  before update on teacher_menu_settings
  for each row execute function update_updated_at();

-- 先生が作ったオリジナル種目
create table if not exists teacher_exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sec int not null default 30,
  emoji text not null default '🌸',
  placement text not null default 'stretch' check (placement in ('prep', 'stretch', 'core', 'barre', 'ending', 'rest')),
  has_split boolean default false,
  description text,
  class_levels text[] not null default '{}',
  visibility text not null default 'public',
  focus_tags text[] not null default '{}',
  recommended boolean not null default false,
  recommended_order int,
  display_mode text not null default 'standard_inline',
  created_by text not null,
  created_at timestamptz default now()
);

alter table teacher_exercises enable row level security;

do $$ begin
  create policy "Anyone can read teacher_exercises" on teacher_exercises
    for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers can manage teacher_exercises" on teacher_exercises
    for all using (is_teacher()) with check (is_teacher());
exception when duplicate_object then null;
end $$;

-- 先生が作ったセットメニュー
create table if not exists teacher_menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '📋',
  description text,
  exercise_ids jsonb not null default '[]',
  class_levels text[] not null default '{}',
  display_mode text not null default 'teacher_section',
  created_by text not null,
  created_at timestamptz default now()
);

do $$ begin alter table teacher_menus add column visibility text not null default 'public'; exception when duplicate_column then null; end $$;
do $$ begin alter table teacher_menus add column focus_tags text[] not null default '{}'; exception when duplicate_column then null; end $$;
do $$ begin alter table teacher_menus add column recommended boolean not null default false; exception when duplicate_column then null; end $$;
do $$ begin alter table teacher_menus add column recommended_order int; exception when duplicate_column then null; end $$;
do $$ begin alter table teacher_menus add column display_mode text not null default 'teacher_section'; exception when duplicate_column then null; end $$;
update teacher_menus set display_mode = 'teacher_section' where display_mode is null;
do $$ begin
  alter table teacher_menus drop constraint if exists teacher_menus_visibility_check;
  alter table teacher_menus add constraint teacher_menus_visibility_check
    check (visibility in ('public', 'class_limited', 'teacher_only'));
exception when others then null;
end $$;

do $$ begin
  alter table teacher_menus drop constraint if exists teacher_menus_display_mode_check;
  alter table teacher_menus add constraint teacher_menus_display_mode_check
    check (display_mode in ('teacher_section', 'standard_inline'));
exception when others then null;
end $$;

alter table teacher_menus enable row level security;

do $$ begin
  create policy "Anyone can read teacher_menus" on teacher_menus
    for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers can manage teacher_menus" on teacher_menus
    for all using (is_teacher()) with check (is_teacher());
exception when duplicate_object then null;
end $$;

-- teacher_menu_settings の CHECK制約を更新（hiddenを追加、既存DBをマイグレーション）
do $$ begin
  alter table teacher_menu_settings drop constraint if exists teacher_menu_settings_status_check;
  alter table teacher_menu_settings add constraint teacher_menu_settings_status_check
    check (status in ('required', 'optional', 'excluded', 'hidden'));
exception when others then null;
end $$;

-- 既存の excluded を hidden に移行（現在の動作を保持）
update teacher_menu_settings set status = 'hidden' where status = 'excluded';

-- ─── 先生：種目/メニュー名・説明の上書き ─────────────

create table if not exists teacher_item_overrides (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,
  item_type text not null check (item_type in ('exercise', 'menu_group')),
  name_override text,
  description_override text,
  created_by text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (item_id, item_type)
);

alter table teacher_item_overrides enable row level security;

do $$ begin
  create policy "Anyone can read teacher_item_overrides" on teacher_item_overrides
    for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers can manage teacher_item_overrides" on teacher_item_overrides
    for all using (is_teacher()) with check (is_teacher());
exception when duplicate_object then null;
end $$;

drop trigger if exists teacher_item_overrides_updated_at on teacher_item_overrides;
create trigger teacher_item_overrides_updated_at
  before update on teacher_item_overrides
  for each row execute function update_updated_at();

-- ─── teacher_item_overrides に追加カラム ─────────────
do $$ begin alter table teacher_item_overrides add column emoji_override text; exception when duplicate_column then null; end $$;
do $$ begin alter table teacher_item_overrides add column sec_override int; exception when duplicate_column then null; end $$;
do $$ begin alter table teacher_item_overrides add column has_split_override boolean; exception when duplicate_column then null; end $$;
do $$ begin alter table teacher_item_overrides add column exercise_ids_override text[]; exception when duplicate_column then null; end $$;
do $$ begin alter table teacher_item_overrides add column display_mode_override text; exception when duplicate_column then null; end $$;

-- ─── custom_exercises に description カラム追加 ──────
do $$ begin
  alter table custom_exercises add column description text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table custom_exercises add column placement text;
exception when duplicate_column then null;
end $$;

update custom_exercises set placement = 'stretch' where placement is null;

do $$ begin
  alter table custom_exercises alter column placement set default 'stretch';
  alter table custom_exercises alter column placement set not null;
exception when undefined_column then null;
end $$;

do $$ begin
  alter table custom_exercises drop constraint if exists custom_exercises_placement_check;
  alter table custom_exercises add constraint custom_exercises_placement_check
    check (placement in ('prep', 'stretch', 'core', 'barre', 'ending', 'rest'));
exception when undefined_table then null;
end $$;

do $$ begin
  alter table teacher_exercises add column placement text;
exception when duplicate_column then null;
end $$;

update teacher_exercises set placement = 'stretch' where placement is null;

do $$ begin
  alter table teacher_exercises alter column placement set default 'stretch';
  alter table teacher_exercises alter column placement set not null;
exception when undefined_column then null;
end $$;

do $$ begin
  alter table teacher_exercises drop constraint if exists teacher_exercises_placement_check;
  alter table teacher_exercises add constraint teacher_exercises_placement_check
    check (placement in ('prep', 'stretch', 'core', 'barre', 'ending', 'rest'));
exception when undefined_table then null;
end $$;

do $$ begin
  alter table teacher_exercises add column visibility text not null default 'public';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table teacher_exercises add column focus_tags text[] not null default '{}';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table teacher_exercises add column recommended boolean not null default false;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table teacher_exercises add column recommended_order int;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table teacher_exercises add column display_mode text not null default 'standard_inline';
exception when duplicate_column then null;
end $$;

update teacher_exercises set display_mode = 'standard_inline' where display_mode is null;

do $$ begin
  alter table teacher_exercises drop constraint if exists teacher_exercises_visibility_check;
  alter table teacher_exercises add constraint teacher_exercises_visibility_check
    check (visibility in ('public', 'class_limited', 'teacher_only'));
exception when undefined_table then null;
end $$;

do $$ begin
  alter table teacher_exercises drop constraint if exists teacher_exercises_display_mode_check;
  alter table teacher_exercises add constraint teacher_exercises_display_mode_check
    check (display_mode in ('teacher_section', 'standard_inline'));
exception when undefined_table then null;
end $$;

-- ─── 公開種目テーブル ────────────────────────────────

create table if not exists public_exercises (
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

create index if not exists idx_public_exercises_downloads
  on public_exercises (download_count desc);

alter table public_exercises enable row level security;

do $$ begin
  create policy "Anyone can read public_exercises" on public_exercises
    for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can manage own public_exercises" on public_exercises
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public_exercises add column placement text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public_exercises add column source_custom_exercise_id text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public_exercises add column preserve_without_menu boolean default true;
exception when duplicate_column then null;
end $$;

update public_exercises set placement = 'stretch' where placement is null;
update public_exercises set preserve_without_menu = true where preserve_without_menu is null;

do $$ begin
  alter table public_exercises alter column placement set default 'stretch';
  alter table public_exercises alter column placement set not null;
  alter table public_exercises alter column preserve_without_menu set default true;
  alter table public_exercises alter column preserve_without_menu set not null;
exception when undefined_column then null;
end $$;

do $$ begin
  alter table public_exercises drop constraint if exists public_exercises_placement_check;
  alter table public_exercises add constraint public_exercises_placement_check
    check (placement in ('prep', 'stretch', 'core', 'barre', 'ending', 'rest'));
exception when undefined_table then null;
end $$;

create index if not exists idx_public_menus_account_source_group
  on public_menus (account_id, source_menu_group_id);

create index if not exists idx_public_exercises_account_source_exercise
  on public_exercises (account_id, source_custom_exercise_id);

-- ダウンロード重複防止テーブル（種目用）
create table if not exists exercise_downloads (
  exercise_id uuid not null references public_exercises(id) on delete cascade,
  account_id uuid not null,
  downloaded_at timestamptz default now(),
  primary key (exercise_id, account_id)
);

alter table exercise_downloads enable row level security;

do $$ begin
  create policy "Users can manage own exercise_downloads" on exercise_downloads
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;

-- 公開種目取得（休止アカウント除外）
create or replace function fetch_active_public_exercises(
  sort_by text default 'download_count',
  max_count int default 20
)
returns setof public_exercises as $$
  select pe.* from public_exercises pe
  where pe.account_id not in (
    select account_id from app_settings where suspended = true
  )
  order by
    case when sort_by = 'download_count' then pe.download_count end desc nulls last,
    case when sort_by = 'created_at' then extract(epoch from pe.created_at) end desc nulls last
  limit max_count;
$$ language sql security definer stable;

-- 重複なしダウンロードカウント（種目用）
create or replace function try_increment_exercise_download_count(target_exercise_id uuid, downloader_account_id uuid)
returns boolean as $$
declare
  was_inserted boolean;
begin
  insert into exercise_downloads (exercise_id, account_id)
  values (target_exercise_id, downloader_account_id)
  on conflict do nothing;

  get diagnostics was_inserted = row_count;

  if was_inserted then
    update public_exercises set download_count = download_count + 1 where id = target_exercise_id;
    return true;
  end if;

  return false;
end;
$$ language plpgsql security definer;

-- ─── 魔法エネルギー蓄積方式マイグレーション ─────────────
-- consumed_magic_date は不要になったため削除
do $$ begin
  alter table family_members drop column consumed_magic_date;
exception when undefined_column then null;
end $$;
