CREATE OR REPLACE FUNCTION public.product_sales_report_by_items(start_date date, end_date date)
 RETURNS TABLE(product_id uuid, product_code text, product_name text, total_qty numeric, total_amount numeric)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    si.product_id,
    p.code as product_code,
    p.name as product_name,
    coalesce(sum(si.qty), 0) as total_qty,
    coalesce(
      sum(
        (coalesce(si.qty, 0) * coalesce(si.price, 0))
        - coalesce(si.discount, 0)
        + coalesce(si.tax, 0)
      ),
      0
    ) as total_amount
  from sale_items si
  join sales s on s.id = si.sale_id
  left join products p on p.id = si.product_id
  where s.date between start_date and end_date
  group by si.product_id, p.code, p.name
  order by total_amount desc nulls last, product_name asc;
$function$
