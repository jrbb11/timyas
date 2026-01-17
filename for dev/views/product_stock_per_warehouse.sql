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