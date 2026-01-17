create table public.reference_counters (
  name text not null,
  last_number integer not null default 0,
  prefix text not null default ''::text,
  constraint reference_counters_pkey primary key (name)
) TABLESPACE pg_default;