-- Challenge duration target support
-- Run this on an existing KeepGoing database.
-- 既存環境の差分適用用です。

do $$ begin
  alter table public.challenges add column daily_minimum_minutes int;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public.challenges drop constraint challenges_type_check;
exception when undefined_object then null;
end $$;

do $$ begin
  alter table public.challenges add constraint challenges_type_check
    check (challenge_type in ('exercise', 'menu', 'duration'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.challenges add constraint challenges_daily_minimum_minutes_check
    check (daily_minimum_minutes is null or daily_minimum_minutes >= 1);
exception when duplicate_object then null;
end $$;
