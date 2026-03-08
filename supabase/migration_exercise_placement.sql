-- placement 軸の追加
-- custom / teacher / public の種目を
-- 準備 -> ストレッチ -> 体幹 -> バー -> おわり -> 休憩
-- で統一する

do $$
begin
  if to_regclass('public.custom_exercises') is not null then
    begin
      alter table public.custom_exercises add column placement text;
    exception when duplicate_column then null;
    end;

    update public.custom_exercises
      set placement = 'stretch'
      where placement is null;

    alter table public.custom_exercises alter column placement set default 'stretch';
    alter table public.custom_exercises alter column placement set not null;
    alter table public.custom_exercises drop constraint if exists custom_exercises_placement_check;
    alter table public.custom_exercises add constraint custom_exercises_placement_check
      check (placement in ('prep', 'stretch', 'core', 'barre', 'ending', 'rest'));
  end if;
end $$;

do $$
begin
  if to_regclass('public.teacher_exercises') is not null then
    begin
      alter table public.teacher_exercises add column placement text;
    exception when duplicate_column then null;
    end;

    update public.teacher_exercises
      set placement = 'stretch'
      where placement is null;

    alter table public.teacher_exercises alter column placement set default 'stretch';
    alter table public.teacher_exercises alter column placement set not null;
    alter table public.teacher_exercises drop constraint if exists teacher_exercises_placement_check;
    alter table public.teacher_exercises add constraint teacher_exercises_placement_check
      check (placement in ('prep', 'stretch', 'core', 'barre', 'ending', 'rest'));
  end if;
end $$;

do $$
begin
  if to_regclass('public.public_exercises') is not null then
    begin
      alter table public.public_exercises add column placement text;
    exception when duplicate_column then null;
    end;

    update public.public_exercises
      set placement = 'stretch'
      where placement is null;

    alter table public.public_exercises alter column placement set default 'stretch';
    alter table public.public_exercises alter column placement set not null;
    alter table public.public_exercises drop constraint if exists public_exercises_placement_check;
    alter table public.public_exercises add constraint public_exercises_placement_check
      check (placement in ('prep', 'stretch', 'core', 'barre', 'ending', 'rest'));
  end if;
end $$;
