create table public.deposits (
  id serial not null,
  account_id integer not null,
  category_id integer not null,
  date date not null,
  amount numeric(14, 2) not null,
  description text null,
  created_at timestamp with time zone not null default now(),
  constraint deposits_pkey primary key (id),
  constraint deposits_account_id_fkey foreign KEY (account_id) references accounts (id) on delete RESTRICT,
  constraint deposits_category_id_fkey foreign KEY (category_id) references deposit_categories (id) on delete RESTRICT
) TABLESPACE pg_default;

create trigger deposits_audit_trigger
after INSERT
or DELETE
or
update on deposits for EACH row
execute FUNCTION audit_trigger_function ();

create trigger trg_deposits_bal
after INSERT
or DELETE on deposits for EACH row
execute FUNCTION _dep_update_balance ();