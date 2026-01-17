create table public.products (
  id uuid not null default gen_random_uuid (),
  name text not null,
  code text not null,
  brand uuid null,
  barcode_symbology text null default 'Code 128'::text,
  category uuid null,
  order_tax numeric null default 0,
  tax_type text null default 'Exclusive'::text,
  description text null,
  type text null default 'Standard Product'::text,
  product_cost numeric not null,
  product_price numeric not null,
  product_unit uuid null,
  sale_unit uuid null,
  purchase_unit uuid null,
  stock_alert integer null default 0,
  has_serial boolean null default false,
  not_for_selling boolean null default false,
  image_urls text[] null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint products_pkey primary key (id),
  constraint products_brand_fkey foreign KEY (brand) references brands (id) on delete set null,
  constraint products_category_fkey foreign KEY (category) references categories (id) on delete set null,
  constraint products_product_unit_fkey foreign KEY (product_unit) references units (id) on delete set null,
  constraint products_purchase_unit_fkey foreign KEY (purchase_unit) references units (id) on delete set null,
  constraint products_sale_unit_fkey foreign KEY (sale_unit) references units (id) on delete set null
) TABLESPACE pg_default;

create trigger products_audit_trigger
after INSERT
or DELETE
or
update on products for EACH row
execute FUNCTION audit_trigger_function ();

create trigger trg_products_ref BEFORE INSERT on products for EACH row
execute FUNCTION generate_reference_for_table ();