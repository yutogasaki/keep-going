alter table public.sessions
  add column if not exists planned_exercise_ids jsonb not null default '[]',
  add column if not exists source_menu_id text,
  add column if not exists source_menu_source text,
  add column if not exists source_menu_name text;

update public.sessions
set planned_exercise_ids = coalesce(planned_exercise_ids, exercise_ids, '[]'::jsonb)
where planned_exercise_ids is null
   or planned_exercise_ids = '[]'::jsonb;

do $$ begin
  alter table public.sessions
    add constraint sessions_source_menu_source_check
      check (source_menu_source is null or source_menu_source in ('preset', 'teacher', 'custom', 'public'));
exception when duplicate_object then null;
end $$;
