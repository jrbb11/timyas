create table public.credit_applications (
  id uuid not null default extensions.uuid_generate_v4 (),
  credit_id uuid not null,
  invoice_id uuid not null,
  amount_applied numeric(10, 2) not null,
  applied_at timestamp without time zone null default now(),
  constraint credit_applications_pkey primary key (id),
  constraint credit_applications_credit_id_fkey foreign KEY (credit_id) references franchisee_credits (id) on delete CASCADE,
  constraint credit_applications_invoice_id_fkey foreign KEY (invoice_id) references franchisee_invoices (id) on delete CASCADE,
  constraint credit_applications_amount_applied_check check ((amount_applied > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_credit_applications_credit_id on public.credit_applications using btree (credit_id) TABLESPACE pg_default;

create index IF not exists idx_credit_applications_invoice_id on public.credit_applications using btree (invoice_id) TABLESPACE pg_default;