-- Challenge rolling / active-day support
-- Run this on an existing KeepGoing database.
-- 新規DBの初期構築ではなく、既存環境の差分適用用です。

do $$ begin
  alter table public.challenges add column window_type text not null default 'calendar';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public.challenges add column goal_type text not null default 'total_count';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public.challenges add column window_days int;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public.challenges add column required_days int;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public.challenges add constraint challenges_window_type_check
    check (window_type in ('calendar', 'rolling'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.challenges add constraint challenges_goal_type_check
    check (goal_type in ('total_count', 'active_day'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.challenges add constraint challenges_window_days_check
    check (window_days is null or window_days >= 1);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.challenges add constraint challenges_required_days_check
    check (required_days is null or required_days >= 1);
exception when duplicate_object then null;
end $$;

create table if not exists public.challenge_enrollments (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges not null,
  account_id uuid references auth.users not null,
  member_id uuid not null,
  joined_at timestamptz not null default now(),
  effective_start_date text not null,
  effective_end_date text not null,
  created_at timestamptz default now(),
  constraint challenge_enrollments_window_check check (effective_end_date >= effective_start_date),
  unique (challenge_id, account_id, member_id)
);

create index if not exists idx_challenge_enrollments_account
  on public.challenge_enrollments (account_id);

alter table public.challenge_enrollments enable row level security;

do $$ begin
  create policy "Users can manage own enrollments" on public.challenge_enrollments
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers can read all enrollments" on public.challenge_enrollments
    for select using (public.is_teacher());
exception when duplicate_object then null;
end $$;
