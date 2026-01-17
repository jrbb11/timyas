CREATE OR REPLACE FUNCTION public.update_sale_payment_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    total_paid NUMERIC;
    sale_total NUMERIC;
    sid UUID;
BEGIN
    sid := COALESCE(NEW.sale_id, OLD.sale_id);

    -- Get total paid for the sale
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM sale_payments
    WHERE sale_id = sid;

    -- Get sale total
    SELECT total_amount INTO sale_total
    FROM sales
    WHERE id = sid;

    -- Update payment_status
    IF total_paid = 0 THEN
        UPDATE sales SET payment_status = 'pending' WHERE id = sid;
    ELSIF total_paid < sale_total THEN
        UPDATE sales SET payment_status = 'partial' WHERE id = sid;
    ELSE
        UPDATE sales SET payment_status = 'paid' WHERE id = sid;
    END IF;

    RETURN NULL;
END;
$function$
