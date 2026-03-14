-- Personal challenges support
-- Run this on an existing KeepGoing database.
-- 既存環境の差分適用用です。

create table if not exists public.personal_challenges (
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

create index if not exists idx_personal_challenges_account
  on public.personal_challenges (account_id);

create index if not exists idx_personal_challenges_member_status
  on public.personal_challenges (member_id, status);

alter table public.personal_challenges enable row level security;

do $$ begin
  create policy "Users can manage own personal challenges" on public.personal_challenges
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;
