create table public.warehouse_stock (
  warehouse_id uuid not null,
  product_id uuid not null,
  stock integer not null default 0,
  constraint warehouse_stock_pkey primary key (warehouse_id, product_id),
  constraint warehouse_stock_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint warehouse_stock_warehouse_id_fkey foreign KEY (warehouse_id) references warehouses (id) on delete CASCADE
) TABLESPACE pg_default;