create table public.franchisee_credits (
  id uuid not null default extensions.uuid_generate_v4 (),
  franchisee_id uuid not null,
  people_branches_id uuid not null,
  amount numeric(10, 2) not null,
  source_type character varying(50) not null,
  source_invoice_id uuid null,
  used_amount numeric(10, 2) null default 0,
  remaining_amount numeric(10, 2) not null,
  notes text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint franchisee_credits_pkey primary key (id),
  constraint franchisee_credits_franchisee_id_fkey foreign KEY (franchisee_id) references people (id) on delete CASCADE,
  constraint franchisee_credits_people_branches_id_fkey foreign KEY (people_branches_id) references people_branches (id) on delete CASCADE,
  constraint franchisee_credits_source_invoice_id_fkey foreign KEY (source_invoice_id) references franchisee_invoices (id) on delete set null,
  constraint franchisee_credits_used_amount_check check ((used_amount >= (0)::numeric)),
  constraint franchisee_credits_amount_check check ((amount > (0)::numeric)),
  constraint valid_amounts check (
    (
      (used_amount <= amount)
      and (remaining_amount = (amount - used_amount))
    )
  ),
  constraint franchisee_credits_remaining_amount_check check ((remaining_amount >= (0)::numeric)),
  constraint franchisee_credits_source_type_check check (
    (
      (source_type)::text = any (
        (
          array[
            'overpayment'::character varying,
            'return'::character varying,
            'adjustment'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_franchisee_credits_franchisee_id on public.franchisee_credits using btree (franchisee_id) TABLESPACE pg_default;

create index IF not exists idx_franchisee_credits_remaining on public.franchisee_credits using btree (remaining_amount) TABLESPACE pg_default
where
  (remaining_amount > (0)::numeric);