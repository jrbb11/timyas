create table public.brands (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  created_at timestamp without time zone null default now(),
  image_url text null,
  constraint brands_pkey primary key (id)
) TABLESPACE pg_default;