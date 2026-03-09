alter table public.teacher_menus
  add column if not exists visibility text not null default 'public',
  add column if not exists focus_tags text[] not null default '{}',
  add column if not exists recommended boolean not null default false,
  add column if not exists recommended_order int;

alter table public.teacher_menus
  drop constraint if exists teacher_menus_visibility_check;

alter table public.teacher_menus
  add constraint teacher_menus_visibility_check
  check (visibility in ('public', 'class_limited', 'teacher_only'));
