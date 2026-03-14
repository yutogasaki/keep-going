-- Challenge rolling / active-day support

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
