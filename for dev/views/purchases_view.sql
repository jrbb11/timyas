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