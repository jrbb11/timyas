create table public.sale_items (
  id uuid not null default gen_random_uuid (),
  sale_id uuid not null,
  product_id uuid not null,
  price numeric not null,
  qty integer not null,
  discount numeric not null default 0,
  tax numeric not null default 0,
  created_at timestamp without time zone not null default now(),
  constraint sale_items_pkey primary key (id),
  constraint sale_items_product_id_fkey foreign KEY (product_id) references products (id) on delete RESTRICT,
  constraint sale_items_sale_id_fkey foreign KEY (sale_id) references sales (id) on delete CASCADE,
  constraint sale_items_discount_check check ((discount >= (0)::numeric)),
  constraint sale_items_qty_check check ((qty <> 0)),
  constraint sale_items_tax_check check ((tax >= (0)::numeric)),
  constraint sale_items_price_check check ((price >= (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists sale_items_sale_id_idx on public.sale_items using btree (sale_id) TABLESPACE pg_default;

create trigger trg_ws_on_sale_items
after INSERT
or DELETE
or
update on sale_items for EACH row
execute FUNCTION fn_ws_on_sale_items ();