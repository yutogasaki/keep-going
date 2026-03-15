alter table sessions
    add column if not exists planned_items jsonb not null default '[]';

alter table menu_groups
    add column if not exists menu_items jsonb not null default '[]';
