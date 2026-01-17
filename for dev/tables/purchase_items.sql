create table public.purchase_items (
  id uuid not null default gen_random_uuid (),
  purchase_id uuid not null,
  product_id uuid not null,
  product_name text null,
  product_code text null,
  cost numeric(10, 2) not null default 0.00,
  qty integer not null default 1,
  discount numeric(10, 2) not null default 0.00,
  tax numeric(10, 2) not null default 0.00,
  subtotal numeric GENERATED ALWAYS as ((((cost * (qty)::numeric) - discount) + tax)) STORED null,
  unit text null default 'Piece'::text,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  kilos numeric null,
  constraint purchase_items_pkey primary key (id),
  constraint purchase_items_product_id_fkey foreign KEY (product_id) references products (id) on delete RESTRICT,
  constraint purchase_items_purchase_id_fkey foreign KEY (purchase_id) references purchases (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger trg_purchase_stock
after INSERT
or DELETE
or
update on purchase_items for EACH row
execute FUNCTION handle_purchase_stock ();