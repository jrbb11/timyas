create table public.accounts (
  id serial not null,
  name text not null,
  type text not null,
  balance numeric(14, 2) not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint accounts_pkey primary key (id)
) TABLESPACE pg_default;

create trigger trg_accounts_updated BEFORE
update on accounts for EACH row
execute FUNCTION updated_at_timestamp ();