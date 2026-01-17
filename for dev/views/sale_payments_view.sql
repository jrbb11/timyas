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