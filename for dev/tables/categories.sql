create table public.categories (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp without time zone null default now(),
  description text null,
  constraint categories_pkey primary key (id)
) TABLESPACE pg_default;