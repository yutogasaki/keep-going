-- Challenge v2a: summary/details, daily cap, tiered rewards

alter table public.challenges add column if not exists summary text;
alter table public.challenges add column if not exists description text;
alter table public.challenges add column if not exists challenge_type text not null default 'exercise';
alter table public.challenges add column if not exists target_exercise_id text;
alter table public.challenges add column if not exists target_menu_id text;
alter table public.challenges add column if not exists menu_source text;
alter table public.challenges add column if not exists daily_cap integer not null default 1;
alter table public.challenges add column if not exists count_unit text not null default 'exercise_completion';
alter table public.challenges add column if not exists reward_kind text not null default 'medal';
alter table public.challenges add column if not exists reward_value integer not null default 0;
alter table public.challenges add column if not exists tier text not null default 'big';
alter table public.challenges add column if not exists icon_emoji text;

update public.challenges
set
  summary = coalesce(summary, title),
  target_exercise_id = coalesce(target_exercise_id, exercise_id),
  daily_cap = coalesce(daily_cap, 1),
  count_unit = coalesce(count_unit, 'exercise_completion'),
  reward_kind = coalesce(reward_kind, 'medal'),
  reward_value = coalesce(reward_value, reward_fuwafuwa_type, 0),
  tier = coalesce(tier, 'big')
where challenge_type = 'exercise';

do $$ begin
  alter table public.challenges
    add constraint challenges_type_check check (challenge_type in ('exercise', 'menu'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.challenges
    add constraint challenges_menu_source_check check (menu_source is null or menu_source in ('teacher', 'preset'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.challenges
    add constraint challenges_count_unit_check check (count_unit in ('exercise_completion', 'menu_completion'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.challenges
    add constraint challenges_daily_cap_check check (daily_cap >= 1);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.challenges
    add constraint challenges_reward_kind_check check (reward_kind in ('star', 'medal'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.challenges
    add constraint challenges_reward_value_check check (reward_value >= 0);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.challenges
    add constraint challenges_tier_check check (tier in ('small', 'big'));
exception when duplicate_object then null;
end $$;
