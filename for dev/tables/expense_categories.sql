create table public.expense_categories (
  id serial not null,
  name text not null,
  created_at timestamp with time zone not null default now(),
  constraint expense_categories_pkey primary key (id),
  constraint expense_categories_name_key unique (name)
) TABLESPACE pg_default;