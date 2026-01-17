create table public.units (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  short_name text not null,
  base_unit text null,
  operator text null,
  operation_value numeric not null default 1,
  created_at timestamp without time zone null default now(),
  constraint units_pkey primary key (id),
  constraint units_operator_check check ((operator = any (array['*'::text, '/'::text])))
) TABLESPACE pg_default;