create table public.franchisee_invoice_payments (
  id uuid not null default gen_random_uuid (),
  invoice_id uuid not null,
  payment_date date not null default CURRENT_DATE,
  amount numeric(14, 2) not null,
  payment_method_id integer null,
  reference_number text null,
  account_id integer not null,
  notes text null,
  receipt_url text null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  adjustment_type character varying(50) null,
  original_payment_id uuid null,
  adjustment_reason text null,
  constraint franchisee_invoice_payments_pkey primary key (id),
  constraint franchisee_invoice_payments_invoice_fkey foreign KEY (invoice_id) references franchisee_invoices (id) on delete CASCADE,
  constraint franchisee_invoice_payments_original_payment_id_fkey foreign KEY (original_payment_id) references franchisee_invoice_payments (id) on delete set null,
  constraint franchisee_invoice_payments_payment_method_fkey foreign KEY (payment_method_id) references payment_methods (id) on delete set null,
  constraint franchisee_invoice_payments_created_by_fkey foreign KEY (created_by) references people (id) on delete set null,
  constraint franchisee_invoice_payments_account_fkey foreign KEY (account_id) references accounts (id) on delete RESTRICT,
  constraint franchisee_invoice_payments_amount_check check ((amount >= (0)::numeric)),
  constraint franchisee_invoice_payments_adjustment_type_check check (
    (
      (
        (adjustment_type)::text = any (
          (
            array[
              'reversal'::character varying,
              'correction'::character varying
            ]
          )::text[]
        )
      )
      or (adjustment_type is null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_franchisee_invoice_payments_invoice on public.franchisee_invoice_payments using btree (invoice_id) TABLESPACE pg_default;

create index IF not exists idx_franchisee_invoice_payments_date on public.franchisee_invoice_payments using btree (payment_date) TABLESPACE pg_default;

create trigger trg_franchisee_invoice_payment_balance
after INSERT
or DELETE on franchisee_invoice_payments for EACH row
execute FUNCTION update_account_balance_franchisee_invoice ();

create trigger trg_update_franchisee_invoice_payment_status
after INSERT
or DELETE
or
update on franchisee_invoice_payments for EACH row
execute FUNCTION update_franchisee_invoice_payment_status ();