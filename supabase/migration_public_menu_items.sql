alter table public_menus
    add column if not exists menu_items jsonb not null default '[]';
