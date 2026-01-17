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