-- KeepGoing Supabase Deploy Script
-- 冪等（何回実行しても安全）
-- Supabase SQL Editor にコピペして実行してください

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
as $$
  select coalesce(
    (select email from auth.users where id = auth.uid()) = any(array[
      'yu.togasaki@gmail.com',
      'ayami.ballet.studio@gmail.com'
    ]),
    false
  );
$$;

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

-- public_menus に custom_exercise_data カラム追加
do $$ begin
  alter table public_menus add column custom_exercise_data jsonb default '[]';
exception when duplicate_column then null;
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

-- ─── RLSポリシー（安全に作成） ────────────────────────

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
  delete from challenge_completions where account_id = target_account_id;
  delete from public_menus where account_id = target_account_id;
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
  has_split boolean default false,
  description text,
  class_levels text[] not null default '{}',
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
  created_by text not null,
  created_at timestamptz default now()
);

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

-- ─── custom_exercises に description カラム追加 ──────
do $$ begin
  alter table custom_exercises add column description text;
exception when duplicate_column then null;
end $$;

-- ─── 公開種目テーブル ────────────────────────────────

create table if not exists public_exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sec int not null default 30,
  emoji text not null default '🌸',
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
