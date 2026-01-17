create table public.warehouses (
  id uuid not null default gen_random_uuid (),
  name text not null,
  code text not null,
  phone text null,
  email text null,
  address text null,
  city text null,
  country text null,
  note text null,
  created_at timestamp without time zone null default now(),
  constraint warehouses_pkey primary key (id),
  constraint warehouses_code_key unique (code)
) TABLESPACE pg_default;