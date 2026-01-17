CREATE OR REPLACE FUNCTION public.update_purchase_payment_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    total_paid NUMERIC;
    purchase_total NUMERIC;
    pid UUID;
BEGIN
    pid := COALESCE(NEW.purchase_id, OLD.purchase_id);

    -- Get total paid for the purchase
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM purchase_payments
    WHERE purchase_id = pid;

    -- Get purchase total
    SELECT total_amount INTO purchase_total
    FROM purchases
    WHERE id = pid;

    -- Update payment_status
    IF total_paid = 0 THEN
        UPDATE purchases SET payment_status = 'pending' WHERE id = pid;
    ELSIF total_paid < purchase_total THEN
        UPDATE purchases SET payment_status = 'partial' WHERE id = pid;
    ELSE
        UPDATE purchases SET payment_status = 'paid' WHERE id = pid;
    END IF;

    RETURN NULL;
END;
$function$
