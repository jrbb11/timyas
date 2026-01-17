create table public.roles (
  id uuid not null default gen_random_uuid (),
  name text not null,
  level integer not null,
  description text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint roles_pkey primary key (id),
  constraint roles_name_key unique (name),
  constraint roles_level_check check (
    (
      (level >= 1)
      and (level <= 4)
    )
  )
) TABLESPACE pg_default;

create index IF not exists roles_level_idx on public.roles using btree (level) TABLESPACE pg_default;

create index IF not exists roles_name_idx on public.roles using btree (name) TABLESPACE pg_default;

create trigger roles_updated_at_trigger BEFORE
update on roles for EACH row
execute FUNCTION updated_at_timestamp ();