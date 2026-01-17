create table public.sales (
  id uuid not null default gen_random_uuid (),
  reference text not null,
  invoice_number text null,
  date date not null,
  warehouse uuid not null,
  order_tax numeric not null default 0,
  discount numeric not null default 0,
  shipping numeric not null default 0,
  status text not null,
  payment_status text not null,
  note text null,
  total_amount numeric not null default 0,
  created_at timestamp without time zone not null default now(),
  is_return boolean not null default false,
  original_sale_id uuid null,
  people_branches_id uuid null,
  constraint sales_pkey primary key (id),
  constraint sales_reference_key unique (reference),
  constraint sales_people_branches_fkey foreign KEY (people_branches_id) references people_branches (id),
  constraint sales_warehouse_fkey foreign KEY (warehouse) references warehouses (id),
  constraint sales_original_sale_id_fkey foreign KEY (original_sale_id) references sales (id),
  constraint sales_payment_status_check check (
    (
      payment_status = any (
        array['pending'::text, 'partial'::text, 'paid'::text]
      )
    )
  ),
  constraint sales_order_tax_check check ((order_tax >= (0)::numeric)),
  constraint sales_shipping_check check ((shipping >= (0)::numeric)),
  constraint sales_status_check check (
    (
      status = any (
        array[
          'order_placed'::text,
          'for_delivery'::text,
          'delivered'::text,
          'cancel'::text
        ]
      )
    )
  ),
  constraint sales_discount_check check ((discount >= (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists sales_date_idx on public.sales using btree (date) TABLESPACE pg_default;

create unique INDEX IF not exists sales_invoice_number_idx on public.sales using btree (invoice_number) TABLESPACE pg_default
where
  (is_return = false);

create index IF not exists sales_reference_idx on public.sales using btree (reference) TABLESPACE pg_default;

create trigger sales_audit_trigger
after INSERT
or DELETE
or
update on sales for EACH row
execute FUNCTION audit_trigger_function ();

create trigger trg_sales_ref BEFORE INSERT on sales for EACH row
execute FUNCTION generate_reference_for_table ();