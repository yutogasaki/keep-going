create table if not exists public.challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges not null,
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

create index if not exists idx_challenge_attempts_account
  on public.challenge_attempts (account_id);

alter table public.challenge_attempts enable row level security;

do $$ begin
  create policy "Users can manage own challenge attempts" on public.challenge_attempts
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers can read all challenge attempts" on public.challenge_attempts
    for select using (is_teacher());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Developers can read all challenge_attempts" on public.challenge_attempts
    for select using (is_developer());
exception when duplicate_object then null;
end $$;

insert into public.challenge_attempts (
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
from public.challenge_enrollments e
left join public.challenge_completions c
  on c.challenge_id = e.challenge_id
 and c.account_id = e.account_id
 and c.member_id = e.member_id
on conflict (challenge_id, account_id, member_id, attempt_no) do nothing;

insert into public.challenge_attempts (
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
from public.challenge_completions c
join public.challenges ch on ch.id = c.challenge_id
left join public.challenge_attempts a
  on a.challenge_id = c.challenge_id
 and a.account_id = c.account_id
 and a.member_id = c.member_id
where a.id is null
on conflict (challenge_id, account_id, member_id, attempt_no) do nothing;
