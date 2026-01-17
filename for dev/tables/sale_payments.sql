create table public.sale_payments (
  id uuid not null default gen_random_uuid (),
  sale_id uuid null,
  amount numeric not null,
  payment_date date null default CURRENT_DATE,
  note text null,
  created_at timestamp without time zone null default now(),
  account_id integer not null,
  payment_method_id integer null,
  reference_number text null,
  receipt_url text null,
  constraint sale_payments_pkey primary key (id),
  constraint sale_payments_account_id_fkey foreign KEY (account_id) references accounts (id) on delete RESTRICT,
  constraint sale_payments_payment_methods_fkey foreign KEY (payment_method_id) references payment_methods (id),
  constraint sale_payments_sale_id_fkey foreign KEY (sale_id) references sales (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger trg_spay_bal
after INSERT
or DELETE on sale_payments for EACH row
execute FUNCTION _spay_update_balance ();

create trigger trg_update_sale_payment_status
after INSERT
or DELETE on sale_payments for EACH row
execute FUNCTION update_sale_payment_status ();