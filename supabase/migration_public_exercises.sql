-- ============================================================
-- KeepGoing マイグレーション: public_exercises / exercise_downloads
-- Supabase Dashboard > SQL Editor で実行してください
-- 目的: じぶん種目の公開機能に必要なテーブル / RLS / RPC を既存環境へ追加
-- ============================================================

create table if not exists public.public_exercises (
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
  on public.public_exercises (download_count desc);

alter table public.public_exercises enable row level security;

do $$ begin
  create policy "Anyone can read public_exercises" on public.public_exercises
    for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can manage own public_exercises" on public.public_exercises
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.public_exercises add column placement text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public.public_exercises add column has_split boolean default false;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public.public_exercises add column description text;
exception when duplicate_column then null;
end $$;

update public.public_exercises
set placement = 'stretch'
where placement is null;

update public.public_exercises
set has_split = false
where has_split is null;

update public.public_exercises
set download_count = 0
where download_count is null;

do $$ begin
  alter table public.public_exercises alter column placement set default 'stretch';
  alter table public.public_exercises alter column placement set not null;
  alter table public.public_exercises alter column has_split set default false;
  alter table public.public_exercises alter column download_count set default 0;
exception when undefined_column then null;
end $$;

do $$ begin
  alter table public.public_exercises drop constraint if exists public_exercises_placement_check;
  alter table public.public_exercises add constraint public_exercises_placement_check
    check (placement in ('prep', 'stretch', 'core', 'barre', 'ending', 'rest'));
exception when undefined_table then null;
end $$;

create table if not exists public.exercise_downloads (
  exercise_id uuid not null references public.public_exercises(id) on delete cascade,
  account_id uuid not null,
  downloaded_at timestamptz default now(),
  primary key (exercise_id, account_id)
);

alter table public.exercise_downloads enable row level security;

do $$ begin
  create policy "Users can manage own exercise_downloads" on public.exercise_downloads
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;

create or replace function public.fetch_active_public_exercises(
  sort_by text default 'download_count',
  max_count int default 20
)
returns setof public.public_exercises as $$
  select pe.* from public.public_exercises pe
  where pe.account_id not in (
    select account_id from public.app_settings where suspended = true
  )
  order by
    case when sort_by = 'download_count' then pe.download_count end desc nulls last,
    case when sort_by = 'created_at' then extract(epoch from pe.created_at) end desc nulls last
  limit max_count;
$$ language sql security definer stable;

create or replace function public.try_increment_exercise_download_count(
  target_exercise_id uuid,
  downloader_account_id uuid
)
returns boolean as $$
declare
  was_inserted boolean;
begin
  insert into public.exercise_downloads (exercise_id, account_id)
  values (target_exercise_id, downloader_account_id)
  on conflict do nothing;

  get diagnostics was_inserted = row_count;

  if was_inserted then
    update public.public_exercises
    set download_count = download_count + 1
    where id = target_exercise_id;
    return true;
  end if;

  return false;
end;
$$ language plpgsql security definer;
