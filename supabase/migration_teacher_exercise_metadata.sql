alter table public.teacher_exercises
  add column if not exists visibility text not null default 'public',
  add column if not exists focus_tags text[] not null default '{}',
  add column if not exists recommended boolean not null default false,
  add column if not exists recommended_order int;

update public.teacher_exercises
set visibility = 'public'
where visibility is null;

update public.teacher_exercises
set focus_tags = '{}'
where focus_tags is null;

update public.teacher_exercises
set recommended = false
where recommended is null;

alter table public.teacher_exercises
  drop constraint if exists teacher_exercises_visibility_check;

alter table public.teacher_exercises
  add constraint teacher_exercises_visibility_check
  check (visibility in ('public', 'class_limited', 'teacher_only'));
