CREATE OR REPLACE FUNCTION public.product_purchase_report_by_items(start_date date, end_date date)
 RETURNS TABLE(product_id uuid, product_code text, product_name text, total_qty numeric, total_amount numeric)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    pi.product_id,
    p.code as product_code,
    p.name as product_name,
    coalesce(sum(pi.qty), 0) as total_qty,
    coalesce(
      sum(
        (coalesce(pi.qty, 0) * coalesce(pi.cost, 0))
        - coalesce(pi.discount, 0)
        + coalesce(pi.tax, 0)
      ),
      0
    ) as total_amount
  from purchase_items pi
  join purchases pu on pu.id = pi.purchase_id
  left join products p on p.id = pi.product_id
  where pu.date between start_date and end_date
  group by pi.product_id, p.code, p.name
  order by total_amount desc nulls last, product_name asc;
$function$
