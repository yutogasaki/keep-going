create table if not exists public.challenge_reward_grants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges not null,
  account_id uuid references auth.users not null,
  member_id uuid not null,
  granted_at timestamptz default now(),
  unique (challenge_id, account_id, member_id)
);

create index if not exists idx_challenge_reward_grants_account
  on public.challenge_reward_grants (account_id);

alter table public.challenge_reward_grants enable row level security;

do $$ begin
  create policy "Users can manage own challenge reward grants" on public.challenge_reward_grants
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Teachers can read all challenge reward grants" on public.challenge_reward_grants
    for select using (public.is_teacher());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Developers can read all challenge_reward_grants" on public.challenge_reward_grants
    for select using (public.is_developer());
exception when duplicate_object then null;
end $$;

insert into public.challenge_reward_grants (challenge_id, account_id, member_id, granted_at)
select challenge_id, account_id, member_id, completed_at
from public.challenge_completions
on conflict (challenge_id, account_id, member_id) do nothing;
