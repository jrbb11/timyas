create table public.franchisee_invoices (
  id uuid not null default gen_random_uuid (),
  invoice_number text not null,
  people_branches_id uuid not null,
  branch_id uuid not null,
  franchisee_id uuid not null,
  invoice_date date not null default CURRENT_DATE,
  period_start date not null,
  period_end date not null,
  due_date date not null,
  subtotal numeric(14, 2) not null default 0,
  tax_amount numeric(14, 2) not null default 0,
  discount numeric(14, 2) not null default 0,
  adjustment_amount numeric(14, 2) not null default 0,
  total_amount numeric(14, 2) not null default 0,
  payment_status text not null default 'unpaid'::text,
  paid_amount numeric(14, 2) not null default 0,
  credit_amount numeric(14, 2) not null default 0,
  balance numeric(14, 2) not null default 0,
  status text not null default 'draft'::text,
  notes text null,
  terms_conditions text null,
  created_by uuid null,
  approved_by uuid null,
  approved_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint franchisee_invoices_pkey primary key (id),
  constraint franchisee_invoices_invoice_number_key unique (invoice_number),
  constraint franchisee_invoices_created_by_fkey foreign KEY (created_by) references app_users (id) on delete set null,
  constraint franchisee_invoices_franchisee_fkey foreign KEY (franchisee_id) references people (id) on delete RESTRICT,
  constraint franchisee_invoices_people_branches_fkey foreign KEY (people_branches_id) references people_branches (id) on delete RESTRICT,
  constraint franchisee_invoices_approved_by_fkey foreign KEY (approved_by) references app_users (id) on delete set null,
  constraint franchisee_invoices_branch_fkey foreign KEY (branch_id) references branches (id) on delete RESTRICT,
  constraint franchisee_invoices_payment_status_check check (
    (
      payment_status = any (
        array[
          'unpaid'::text,
          'partial'::text,
          'paid'::text,
          'overdue'::text
        ]
      )
    )
  ),
  constraint franchisee_invoices_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'sent'::text,
          'approved'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_franchisee_invoices_franchisee on public.franchisee_invoices using btree (franchisee_id) TABLESPACE pg_default;

create index IF not exists idx_franchisee_invoices_branch on public.franchisee_invoices using btree (branch_id) TABLESPACE pg_default;

create index IF not exists idx_franchisee_invoices_period on public.franchisee_invoices using btree (period_start, period_end) TABLESPACE pg_default;

create index IF not exists idx_franchisee_invoices_status on public.franchisee_invoices using btree (status, payment_status) TABLESPACE pg_default;

create index IF not exists idx_franchisee_invoices_date on public.franchisee_invoices using btree (invoice_date) TABLESPACE pg_default;

create trigger auto_apply_credits_on_invoice_creation
after INSERT on franchisee_invoices for EACH row
execute FUNCTION trigger_auto_apply_credits ();

create trigger trg_generate_franchisee_invoice_number BEFORE INSERT on franchisee_invoices for EACH row when (
  new.invoice_number is null
  or new.invoice_number = ''::text
)
execute FUNCTION generate_franchisee_invoice_number ();