create table public.transfers (
  id serial not null,
  from_account_id integer not null,
  to_account_id integer not null,
  date date not null,
  amount numeric(14, 2) not null,
  description text null,
  created_at timestamp with time zone not null default now(),
  constraint transfers_pkey primary key (id),
  constraint transfers_from_account_id_fkey foreign KEY (from_account_id) references accounts (id) on delete RESTRICT,
  constraint transfers_to_account_id_fkey foreign KEY (to_account_id) references accounts (id) on delete RESTRICT
) TABLESPACE pg_default;

create trigger transfers_audit_trigger
after INSERT
or DELETE
or
update on transfers for EACH row
execute FUNCTION audit_trigger_function ();

create trigger trg_transfers_bal
after INSERT
or DELETE on transfers for EACH row
execute FUNCTION _trf_update_balance ();