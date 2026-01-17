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