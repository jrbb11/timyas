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