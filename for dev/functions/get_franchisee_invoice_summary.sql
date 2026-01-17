CREATE OR REPLACE FUNCTION public.get_franchisee_invoice_summary(p_franchisee_id uuid)
 RETURNS TABLE(total_invoices bigint, total_amount numeric, total_paid numeric, total_outstanding numeric, overdue_amount numeric, overdue_count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_invoices,
        COALESCE(SUM(fi.total_amount), 0) as total_amount,
        COALESCE(SUM(fi.paid_amount), 0) as total_paid,
        COALESCE(SUM(fi.balance), 0) as total_outstanding,
        COALESCE(SUM(CASE WHEN fi.payment_status = 'overdue' THEN fi.balance ELSE 0 END), 0) as overdue_amount,
        COUNT(CASE WHEN fi.payment_status = 'overdue' THEN 1 END)::BIGINT as overdue_count
    FROM franchisee_invoices fi
    WHERE fi.franchisee_id = p_franchisee_id
        AND fi.status != 'cancelled';
END;
$function$
