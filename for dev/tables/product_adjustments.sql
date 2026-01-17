create table public.product_adjustments (
  id uuid not null default gen_random_uuid (),
  adjustment_batch_id uuid null,
  product_id uuid not null,
  type text not null,
  quantity numeric not null,
  before_stock numeric not null,
  after_stock numeric not null,
  adjusted_by uuid null,
  adjusted_at timestamp with time zone null default timezone ('Asia/Manila'::text, now()),
  unit_cost numeric(10, 2) null,
  total_cost numeric(12, 2) null,
  constraint product_adjustments_pkey primary key (id),
  constraint product_adjustments_adjusted_by_fkey foreign KEY (adjusted_by) references app_users (id) on delete set null not VALID,
  constraint product_adjustments_adjustment_batch_id_fkey foreign KEY (adjustment_batch_id) references adjustment_batches (id) on delete set null,
  constraint product_adjustments_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint product_adjustments_quantity_check check ((quantity >= (0)::numeric)),
  constraint product_adjustments_type_check check (
    (
      type = any (array['addition'::text, 'subtraction'::text])
    )
  )
) TABLESPACE pg_default;

create trigger trg_apply_adj_stock
after INSERT
or DELETE
or
update on product_adjustments for EACH row
execute FUNCTION fn_apply_adjustment_stock ();