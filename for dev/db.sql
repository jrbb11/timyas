create table public.accounts (
    id serial not null,
    name text not null,
    type text not null,
    balance numeric(14, 2) not null default 0,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint accounts_pkey primary key (id)
  ) TABLESPACE pg_default;
  
  create trigger trg_accounts_updated BEFORE
  update on accounts for EACH row
  execute FUNCTION updated_at_timestamp ();
  
  
  create table public.adjustment_batches (
    id uuid not null default gen_random_uuid (),
    reference_code text null,
    reason text null,
    adjusted_by uuid null,
    adjusted_at timestamp with time zone null default timezone ('Asia/Manila'::text, now()),
    warehouse uuid not null,
    constraint adjustment_batches_pkey primary key (id),
    constraint adjustment_batches_reference_code_key unique (reference_code),
    constraint adjustment_batches_adjusted_by_fkey foreign KEY (adjusted_by) references people (id),
    constraint adjustment_batches_warehouse_fkey foreign KEY (warehouse) references warehouses (id) on delete RESTRICT
  ) TABLESPACE pg_default;
  
  create trigger trg_adjustments_ref BEFORE INSERT on adjustment_batches for EACH row
  execute FUNCTION generate_reference_for_table ();
  
  create table public.brands (
    id uuid not null default gen_random_uuid (),
    name text not null,
    description text null,
    created_at timestamp without time zone null default now(),
    image_url text null,
    constraint brands_pkey primary key (id)
  ) TABLESPACE pg_default;
  
  create table public.categories (
    id uuid not null default gen_random_uuid (),
    name text not null,
    created_at timestamp without time zone null default now(),
    description text null,
    constraint categories_pkey primary key (id)
  ) TABLESPACE pg_default;
  
  create table public.deposit_categories (
    id serial not null,
    name text not null,
    created_at timestamp with time zone not null default now(),
    constraint deposit_categories_pkey primary key (id),
    constraint deposit_categories_name_key unique (name)
  ) TABLESPACE pg_default;
  
  create table public.deposits (
    id serial not null,
    account_id integer not null,
    category_id integer not null,
    date date not null,
    amount numeric(14, 2) not null,
    description text null,
    created_at timestamp with time zone not null default now(),
    constraint deposits_pkey primary key (id),
    constraint deposits_account_id_fkey foreign KEY (account_id) references accounts (id) on delete RESTRICT,
    constraint deposits_category_id_fkey foreign KEY (category_id) references deposit_categories (id) on delete RESTRICT
  ) TABLESPACE pg_default;
  
  create trigger trg_deposits_bal
  after INSERT
  or DELETE on deposits for EACH row
  execute FUNCTION _dep_update_balance ();
  
  create table public.expense_categories (
    id serial not null,
    name text not null,
    created_at timestamp with time zone not null default now(),
    constraint expense_categories_pkey primary key (id),
    constraint expense_categories_name_key unique (name)
  ) TABLESPACE pg_default;
  
  create table public.expenses (
    id serial not null,
    account_id integer not null,
    category_id integer not null,
    date date not null,
    amount numeric(14, 2) not null,
    description text null,
    created_at timestamp with time zone not null default now(),
    constraint expenses_pkey primary key (id),
    constraint expenses_account_id_fkey foreign KEY (account_id) references accounts (id) on delete RESTRICT,
    constraint expenses_category_id_fkey foreign KEY (category_id) references expense_categories (id) on delete RESTRICT
  ) TABLESPACE pg_default;
  
  create trigger trg_expenses_bal
  after INSERT
  or DELETE on expenses for EACH row
  execute FUNCTION _exp_update_balance ();
  
  create table public.payment_methods (
    id serial not null,
    name text not null,
    constraint payment_methods_pkey primary key (id),
    constraint payment_methods_name_key unique (name)
  ) TABLESPACE pg_default;
  
  create table public.people (
    id uuid not null default gen_random_uuid (),
    type text not null,
    name text not null,
    company text null,
    email text null,
    phone text null,
    address text null,
    city text null,
    country text null,
    is_active boolean null default true,
    note text null,
    created_at timestamp without time zone null default now(),
    user_id uuid null,
    constraint people_pkey primary key (id),
    constraint people_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null,
    constraint people_type_check check (
      (
        type = any (
          array['customer'::text, 'supplier'::text, 'user'::text]
        )
      )
    )
  ) TABLESPACE pg_default;
  
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
    constraint product_adjustments_pkey primary key (id),
    constraint product_adjustments_adjusted_by_fkey foreign KEY (adjusted_by) references people (id),
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
  
  create trigger trg_products_ref BEFORE INSERT on products for EACH row
  execute FUNCTION generate_reference_for_table ();
  
  
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
    subtotal numeric GENERATED ALWAYS as ((((cost * (qty)::numeric) - discount) + tax)) STORED (12, 2) null,
    unit text null default 'Piece'::text,
    created_at timestamp with time zone null default timezone ('utc'::text, now()),
    constraint purchase_items_pkey primary key (id),
    constraint purchase_items_product_id_fkey foreign KEY (product_id) references products (id) on delete RESTRICT,
    constraint purchase_items_purchase_id_fkey foreign KEY (purchase_id) references purchases (id) on delete CASCADE
  ) TABLESPACE pg_default;
  
  create trigger trg_purchase_stock
  after INSERT on purchase_items for EACH row
  execute FUNCTION handle_purchase_stock ();
  
  create table public.purchase_payments (
    id uuid not null default gen_random_uuid (),
    purchase_id uuid null,
    amount numeric not null,
    payment_date date null default CURRENT_DATE,
    payment_method text null,
    note text null,
    created_at timestamp without time zone null default now(),
    account_id integer not null,
    constraint purchase_payments_pkey primary key (id),
    constraint purchase_payments_account_id_fkey foreign KEY (account_id) references accounts (id) on delete RESTRICT,
    constraint purchase_payments_purchase_id_fkey foreign KEY (purchase_id) references purchases (id) on delete CASCADE
  ) TABLESPACE pg_default;
  
  create trigger trg_ppay_bal
  after INSERT
  or DELETE on purchase_payments for EACH row
  execute FUNCTION _ppay_update_balance ();
  
  create table public.purchase_returns (
    id serial not null,
    purchase_id uuid not null,
    reference text not null,
    date date not null,
    total_refund_amt numeric(14, 2) not null,
    created_at timestamp with time zone not null default now(),
    constraint purchase_returns_pkey primary key (id),
    constraint purchase_returns_purchase_id_fkey foreign KEY (purchase_id) references purchases (id) on delete CASCADE
  ) TABLESPACE pg_default;
  
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
    constraint purchases_pkey primary key (id),
    constraint purchases_reference_key unique (reference),
    constraint purchases_supplier_fkey foreign KEY (supplier) references people (id),
    constraint purchases_warehouse_fkey foreign KEY (warehouse) references warehouses (id)
  ) TABLESPACE pg_default;
  
  create trigger trg_purchases_ref BEFORE INSERT on purchases for EACH row
  execute FUNCTION generate_reference_for_table ();
  
  create table public.reference_counters (
    name text not null,
    last_number integer not null default 0,
    prefix text not null default ''::text,
    constraint reference_counters_pkey primary key (name)
  ) TABLESPACE pg_default;
  
  
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
  
  create table public.sale_payments (
    id uuid not null default gen_random_uuid (),
    sale_id uuid null,
    amount numeric not null,
    payment_date date null default CURRENT_DATE,
    note text null,
    created_at timestamp without time zone null default now(),
    account_id integer not null,
    payment_method_id integer null,
    reference_number text null,
    receipt_url text null,
    constraint sale_payments_pkey primary key (id),
    constraint sale_payments_account_id_fkey foreign KEY (account_id) references accounts (id) on delete RESTRICT,
    constraint sale_payments_payment_methods_fkey foreign KEY (payment_method_id) references payment_methods (id),
    constraint sale_payments_sale_id_fkey foreign KEY (sale_id) references sales (id) on delete CASCADE
  ) TABLESPACE pg_default;
  
  create trigger trg_spay_bal
  after INSERT
  or DELETE on sale_payments for EACH row
  execute FUNCTION _spay_update_balance ();
  
  create table public.sales (
    id uuid not null default gen_random_uuid (),
    reference text not null,
    invoice_number text null,
    date date not null,
    customer uuid not null,
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
    constraint sales_pkey primary key (id),
    constraint sales_reference_key unique (reference),
    constraint sales_warehouse_fkey foreign KEY (warehouse) references warehouses (id),
    constraint sales_original_sale_id_fkey foreign KEY (original_sale_id) references sales (id),
    constraint sales_customer_fkey foreign KEY (customer) references people (id),
    constraint sales_order_tax_check check ((order_tax >= (0)::numeric)),
    constraint sales_discount_check check ((discount >= (0)::numeric)),
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
    constraint sales_payment_status_check check (
      (
        payment_status = any (
          array['pending'::text, 'partial'::text, 'paid'::text]
        )
      )
    )
  ) TABLESPACE pg_default;
  
  create index IF not exists sales_date_idx on public.sales using btree (date) TABLESPACE pg_default;
  
  create unique INDEX IF not exists sales_invoice_number_idx on public.sales using btree (invoice_number) TABLESPACE pg_default
  where
    (is_return = false);
  
  create index IF not exists sales_reference_idx on public.sales using btree (reference) TABLESPACE pg_default;
  
  create trigger trg_sales_ref BEFORE INSERT on sales for EACH row
  execute FUNCTION generate_reference_for_table ();
  
  create table public.transfers (
    id serial not null,
    from_account_id integer not null,
    to_account_id integer not null,
    date date not null,
    amount numeric(14, 2) not null,
    description text null,
    created_at timestamp with time zone not null default now(),
    constraint transfers_pkey primary key (id),
    constraint transfers_from_account_id_fkey foreign KEY (from_account_id) references accounts (id) on delete RESTRICT,
    constraint transfers_to_account_id_fkey foreign KEY (to_account_id) references accounts (id) on delete RESTRICT
  ) TABLESPACE pg_default;
  
  create trigger trg_transfers_bal
  after INSERT
  or DELETE on transfers for EACH row
  execute FUNCTION _trf_update_balance ();
  
  create table public.units (
    id uuid not null default extensions.uuid_generate_v4 (),
    name text not null,
    short_name text not null,
    base_unit text null,
    operator text null,
    operation_value numeric not null default 1,
    created_at timestamp without time zone null default now(),
    constraint units_pkey primary key (id),
    constraint units_operator_check check ((operator = any (array['*'::text, '/'::text])))
  ) TABLESPACE pg_default;
  
  create table public.warehouse_stock (
    warehouse_id uuid not null,
    product_id uuid not null,
    stock integer not null default 0,
    constraint warehouse_stock_pkey primary key (warehouse_id, product_id),
    constraint uq_warehouse_product unique (warehouse_id, product_id),
    constraint uq_warehouse_stock_pair unique (warehouse_id, product_id),
    constraint warehouse_stock_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
    constraint warehouse_stock_warehouse_id_fkey foreign KEY (warehouse_id) references warehouses (id) on delete CASCADE
  ) TABLESPACE pg_default;
  
  create table public.warehouses (
    id uuid not null default gen_random_uuid (),
    name text not null,
    code text not null,
    phone text null,
    email text null,
    address text null,
    city text null,
    country text null,
    note text null,
    created_at timestamp without time zone null default now(),
    constraint warehouses_pkey primary key (id),
    constraint warehouses_code_key unique (code)
  ) TABLESPACE pg_default;