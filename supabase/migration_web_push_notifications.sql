create table if not exists public.web_push_subscriptions (
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

create index if not exists idx_web_push_subscriptions_account
  on public.web_push_subscriptions (account_id);

create index if not exists idx_web_push_subscriptions_schedule
  on public.web_push_subscriptions (notification_time, time_zone);

alter table public.web_push_subscriptions enable row level security;

do $$ begin
  create policy "Users can manage own push subscriptions" on public.web_push_subscriptions
    for all using (auth.uid() = account_id) with check (auth.uid() = account_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create trigger web_push_subscriptions_updated_at before update on public.web_push_subscriptions
    for each row execute function update_updated_at();
exception when duplicate_object then null;
end $$;
