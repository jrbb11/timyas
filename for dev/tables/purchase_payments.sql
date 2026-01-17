create table public.purchase_payments (
  id uuid not null default gen_random_uuid (),
  purchase_id uuid null,
  amount numeric not null,
  payment_date date null default CURRENT_DATE,
  payment_method text null,
  note text null,
  created_at timestamp without time zone null default now(),
  account_id integer not null,
  constraint purchase_payments_pkey primary key (id),
  constraint purchase_payments_account_id_fkey foreign KEY (account_id) references accounts (id) on delete RESTRICT,
  constraint purchase_payments_purchase_id_fkey foreign KEY (purchase_id) references purchases (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger trg_ppay_bal
after INSERT
or DELETE on purchase_payments for EACH row
execute FUNCTION _ppay_update_balance ();

create trigger trg_update_purchase_payment_status
after INSERT
or DELETE on purchase_payments for EACH row
execute FUNCTION update_purchase_payment_status ();