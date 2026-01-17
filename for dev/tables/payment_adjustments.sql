create table public.payment_adjustments (
  id uuid not null default extensions.uuid_generate_v4 (),
  payment_id uuid not null,
  adjustment_type character varying(50) not null,
  original_amount numeric(10, 2) not null,
  adjusted_amount numeric(10, 2) not null,
  difference numeric(10, 2) not null,
  reason text not null,
  adjusted_by uuid null,
  adjusted_at timestamp without time zone null default now(),
  constraint payment_adjustments_pkey primary key (id),
  constraint payment_adjustments_adjusted_by_fkey foreign KEY (adjusted_by) references auth.users (id) on delete set null,
  constraint payment_adjustments_payment_id_fkey foreign KEY (payment_id) references franchisee_invoice_payments (id) on delete CASCADE,
  constraint payment_adjustments_adjusted_amount_check check ((adjusted_amount >= (0)::numeric)),
  constraint payment_adjustments_adjustment_type_check check (
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
  )
) TABLESPACE pg_default;

create index IF not exists idx_payment_adjustments_payment_id on public.payment_adjustments using btree (payment_id) TABLESPACE pg_default;

create index IF not exists idx_payment_adjustments_adjusted_at on public.payment_adjustments using btree (adjusted_at) TABLESPACE pg_default;