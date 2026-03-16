do $$ begin
  alter table public.public_menus add column source_menu_group_id text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public.public_exercises add column source_custom_exercise_id text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public.public_exercises add column preserve_without_menu boolean default true;
exception when duplicate_column then null;
end $$;

update public.public_exercises
set preserve_without_menu = true
where preserve_without_menu is null;

do $$ begin
  alter table public.public_exercises alter column preserve_without_menu set default true;
  alter table public.public_exercises alter column preserve_without_menu set not null;
exception when undefined_column then null;
end $$;

create index if not exists idx_public_menus_account_source_group
  on public.public_menus (account_id, source_menu_group_id);

create index if not exists idx_public_exercises_account_source_exercise
  on public.public_exercises (account_id, source_custom_exercise_id);
