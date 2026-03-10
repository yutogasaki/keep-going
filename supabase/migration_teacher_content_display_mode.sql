alter table public.teacher_exercises
  add column if not exists display_mode text not null default 'standard_inline';

update public.teacher_exercises
set display_mode = 'standard_inline'
where display_mode is null;

alter table public.teacher_exercises
  drop constraint if exists teacher_exercises_display_mode_check;

alter table public.teacher_exercises
  add constraint teacher_exercises_display_mode_check
  check (display_mode in ('teacher_section', 'standard_inline'));

alter table public.teacher_menus
  add column if not exists display_mode text not null default 'teacher_section';

update public.teacher_menus
set display_mode = 'teacher_section'
where display_mode is null;

alter table public.teacher_menus
  drop constraint if exists teacher_menus_display_mode_check;

alter table public.teacher_menus
  add constraint teacher_menus_display_mode_check
  check (display_mode in ('teacher_section', 'standard_inline'));
