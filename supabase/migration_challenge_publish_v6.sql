-- Challenge publish window support
-- Run this on an existing KeepGoing database.
-- 既存環境の差分適用用です。

do $$ begin
  alter table public.challenges add column publish_mode text not null default 'seasonal';
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public.challenges add column publish_start_date text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public.challenges add column publish_end_date text;
exception when duplicate_column then null;
end $$;

update public.challenges
set
  publish_start_date = coalesce(publish_start_date, start_date),
  publish_end_date = coalesce(publish_end_date, end_date)
where publish_mode = 'seasonal';

do $$ begin
  alter table public.challenges add constraint challenges_publish_mode_check
    check (publish_mode in ('seasonal', 'always_on'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.challenges add constraint challenges_publish_window_check
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
