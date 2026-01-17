create table public.adjustment_batches (
  id uuid not null default gen_random_uuid (),
  reference_code text null,
  reason text null,
  adjusted_by uuid null,
  adjusted_at timestamp with time zone null default timezone ('Asia/Manila'::text, now()),
  warehouse uuid not null,
  notes text null,
  constraint adjustment_batches_pkey primary key (id),
  constraint adjustment_batches_reference_code_key unique (reference_code),
  constraint adjustment_batches_adjusted_by_fkey foreign KEY (adjusted_by) references app_users (id) on delete set null not VALID,
  constraint adjustment_batches_warehouse_fkey foreign KEY (warehouse) references warehouses (id) on delete RESTRICT
) TABLESPACE pg_default;

create trigger trg_adjustments_ref BEFORE INSERT on adjustment_batches for EACH row
execute FUNCTION generate_reference_for_table ();