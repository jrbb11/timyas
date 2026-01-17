create table public.branches (
  id uuid not null default gen_random_uuid (),
  name text not null,
  code text null,
  address text null,
  city text null,
  country text null,
  created_at timestamp without time zone null default now(),
  constraint branches_pkey primary key (id),
  constraint branches_code_key unique (code)
) TABLESPACE pg_default;