create table public.franchisee_invoice_items (
  id uuid not null default gen_random_uuid (),
  invoice_id uuid not null,
  sale_id uuid not null,
  description text not null,
  sale_reference text not null,
  sale_date date not null,
  quantity integer not null default 1,
  unit_price numeric(14, 2) not null default 0,
  discount numeric(14, 2) not null default 0,
  tax numeric(14, 2) not null default 0,
  line_total numeric(14, 2) not null default 0,
  created_at timestamp with time zone not null default now(),
  shipping numeric(14, 2) not null default 0,
  constraint franchisee_invoice_items_pkey primary key (id),
  constraint franchisee_invoice_items_invoice_fkey foreign KEY (invoice_id) references franchisee_invoices (id) on delete CASCADE,
  constraint franchisee_invoice_items_sale_fkey foreign KEY (sale_id) references sales (id) on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists idx_franchisee_invoice_items_invoice on public.franchisee_invoice_items using btree (invoice_id) TABLESPACE pg_default;

create index IF not exists idx_franchisee_invoice_items_sale on public.franchisee_invoice_items using btree (sale_id) TABLESPACE pg_default;

create index IF not exists idx_franchisee_invoice_items_shipping on public.franchisee_invoice_items using btree (shipping) TABLESPACE pg_default
where
  (shipping > (0)::numeric);