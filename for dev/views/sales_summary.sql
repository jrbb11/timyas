create view public.sales_summary as
select
  sales.id,
  sales.invoice_number,
  sales.total_amount as total
from
  sales;