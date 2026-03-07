-- ============================================================
-- KeepGoing user_roles migration
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================================

-- 役割テーブル
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email)),
  role text not null check (role in ('teacher', 'developer')),
  created_at timestamptz default now(),
  unique (email, role)
);

create index if not exists idx_user_roles_role on user_roles (role);

alter table user_roles enable row level security;

-- 既存の hardcoded email を seed
insert into user_roles (email, role)
values
  ('yu.togasaki@gmail.com', 'teacher'),
  ('yu.togasaki@gmail.com', 'developer'),
  ('ayami.ballet.studio@gmail.com', 'teacher')
on conflict (email, role) do nothing;

-- user_roles を参照する role 判定へ移行
create or replace function is_teacher()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1
    from public.user_roles
    where email = lower(coalesce((select email from auth.users where id = auth.uid()), ''))
      and role = 'teacher'
  );
$$;

create or replace function is_developer()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1
    from public.user_roles
    where email = lower(coalesce((select email from auth.users where id = auth.uid()), ''))
      and role = 'developer'
  );
$$;

do $$ begin
  create policy "Developers can manage user_roles" on user_roles
    for all using (is_developer()) with check (is_developer());
exception when duplicate_object then null;
end $$;
