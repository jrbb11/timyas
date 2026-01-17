create table public.deposit_categories (
  id serial not null,
  name text not null,
  created_at timestamp with time zone not null default now(),
  constraint deposit_categories_pkey primary key (id),
  constraint deposit_categories_name_key unique (name)
) TABLESPACE pg_default;