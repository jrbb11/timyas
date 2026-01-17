create table public.purchases (
  id uuid not null default gen_random_uuid (),
  date date not null,
  supplier uuid not null,
  warehouse uuid not null,
  order_tax numeric(10, 2) null default 0.00,
  discount numeric(10, 2) null default 0.00,
  shipping numeric(10, 2) null default 0.00,
  status text null default 'received'::text,
  note text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  total_amount numeric(12, 2) null,
  reference text null,
  payment_status text not null default 'pending'::text,
  constraint purchases_pkey primary key (id),
  constraint purchases_reference_key unique (reference),
  constraint purchases_supplier_fkey foreign KEY (supplier) references people (id),
  constraint purchases_warehouse_fkey foreign KEY (warehouse) references warehouses (id)
) TABLESPACE pg_default;

create trigger purchases_audit_trigger
after INSERT
or DELETE
or
update on purchases for EACH row
execute FUNCTION audit_trigger_function ();

create trigger trg_purchases_ref BEFORE INSERT on purchases for EACH row
execute FUNCTION generate_reference_for_table ();