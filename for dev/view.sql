-- SQL view definitions for Timyas ERP

-- Deposits View
create view public.deposits_view as
select
  d.id,
  d.date,
  dc.name as category,
  a.name as account,
  d.amount,
  d.description
from
  deposits d
  left join deposit_categories dc on dc.id = d.category_id
  left join accounts a on a.id = d.account_id
order by
  d.date desc;

-- Expenses View
create view public.expenses_view as
select
  e.id,
  e.date,
  c.name as category,
  a.name as account,
  e.amount,
  e.description
from
  expenses e
  left join expense_categories c on e.category_id = c.id
  left join accounts a on e.account_id = a.id
order by
  e.date desc;

-- People Branches View
create view public.people_branches_view as
select
  pb.id,
  pb.person_id,
  p.name as person_name,
  pb.branch_id,
  b.name as branch_name,
  pb.assigned_at
from
  people_branches pb
  join people p on pb.person_id = p.id
  join branches b on pb.branch_id = b.id;

-- Product Stock Per Warehouse
create view public.product_stock_per_warehouse as
select
  p.id,
  p.name,
  p.code,
  p.product_cost,
  p.product_price,
  ws.warehouse_id,
  COALESCE(ws.stock, 0) as stock
from
  products p
  left join warehouse_stock ws on ws.product_id = p.id;

-- Product Stock View
create view public.product_stock_view as
select
  p.id,
  p.name,
  p.code,
  p.product_cost,
  p.product_price,
  COALESCE(sum(ws.stock), 0::bigint) as stock,
  p.stock_alert,
  case
    when COALESCE(sum(ws.stock), 0::bigint) <= p.stock_alert then 'Low Stock'::text
    when COALESCE(sum(ws.stock), 0::bigint) = 0 then 'Out of Stock'::text
    else 'In Stock'::text
  end as stock_status
from
  products p
  left join warehouse_stock ws on p.id = ws.product_id
group by
  p.id,
  p.name,
  p.code,
  p.product_cost,
  p.product_price,
  p.stock_alert;

-- Purchases View
create view public.purchases_view as
select
  p.id,
  p.date,
  p.reference,
  pe.name as supplier,
  w.name as warehouse,
  p.status,
  p.total_amount as grand_total,
  COALESCE(sum(pp.amount), 0::numeric) as paid,
  p.total_amount - COALESCE(sum(pp.amount), 0::numeric) as due,
  COALESCE(sum(pi.qty), 0::bigint) as total_quantity
from
  purchases p
  left join people pe on p.supplier = pe.id
  left join warehouses w on p.warehouse = w.id
  left join purchase_payments pp on pp.purchase_id = p.id
  left join purchase_items pi on pi.purchase_id = p.id
group by
  p.id,
  pe.name,
  w.name;

-- Sale Payments View
create view public.sale_payments_view as
select
  sp.id,
  sp.sale_id,
  s.invoice_number as sale_invoice,
  sp.amount,
  sp.payment_date,
  pm.name as payment_method,
  sp.reference_number,
  sp.receipt_url,
  sp.account_id,
  acc.name as account_name,
  sp.created_at
from
  sale_payments sp
  left join sales s on s.id = sp.sale_id
  left join payment_methods pm on pm.id = sp.payment_method_id
  left join accounts acc on acc.id = sp.account_id
order by
  sp.payment_date desc;

-- Sales Summary
create view public.sales_summary as
select
  sales.id,
  sales.invoice_number,
  sales.total_amount as total
from
  sales;

-- Sales View
create view public.sales_view as
select
  s.id,
  s.reference,
  s.invoice_number,
  s.date,
  s.people_branches_id,
  pbv.person_id,
  pbv.person_name as customer,
  pbv.branch_name as branch,
  w.name as warehouse_name,
  s.warehouse,
  s.order_tax,
  s.discount,
  s.shipping,
  s.status,
  s.payment_status,
  s.note,
  s.total_amount,
  s.created_at,
  s.is_return,
  s.original_sale_id,
  COALESCE(sp.paid, 0::numeric) as paid,
  s.total_amount - COALESCE(sp.paid, 0::numeric) as due
from
  sales s
  left join people_branches_view pbv on s.people_branches_id = pbv.id
  left join warehouses w on s.warehouse = w.id
  left join (
    select
      sale_payments.sale_id,
      sum(sale_payments.amount) as paid
    from
      sale_payments
    group by
      sale_payments.sale_id
  ) sp on s.id = sp.sale_id;

-- Sales With Due
create view public.sales_with_due as
select
  s.id,
  s.invoice_number,
  s.total_amount as total,
  s.total_amount - COALESCE(sum(sp.amount), 0::numeric) as due
from
  sales s
  left join sale_payments sp on sp.sale_id = s.id
group by
  s.id,
  s.invoice_number,
  s.total_amount
having
  (
    s.total_amount - COALESCE(sum(sp.amount), 0::numeric)
  ) > 0::numeric; 