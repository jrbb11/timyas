CREATE OR REPLACE FUNCTION public.update_franchisee_invoice_payment_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_invoice_id UUID;
    total_paid NUMERIC;
    total_credits NUMERIC;
    invoice_total NUMERIC;
    invoice_due_date DATE;
    is_overdue BOOLEAN;
    v_people_branches_id UUID;
    v_franchisee_id UUID;
    v_excess_payment NUMERIC;
BEGIN
    v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Get total cash/cheque paid
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM franchisee_invoice_payments
    WHERE invoice_id = v_invoice_id;

    -- Get total credit applied
    SELECT COALESCE(SUM(amount_applied), 0) INTO total_credits
    FROM credit_applications
    WHERE invoice_id = v_invoice_id;
    
    -- Get invoice total, due date, and branch info
    SELECT total_amount, due_date, people_branches_id, franchisee_id 
    INTO invoice_total, invoice_due_date, v_people_branches_id, v_franchisee_id
    FROM franchisee_invoices
    WHERE id = v_invoice_id;
    
    -- Check if overdue
    is_overdue := (CURRENT_DATE > invoice_due_date) AND ((total_paid + total_credits) < invoice_total);
    
    -- Update payment status and balance
    UPDATE franchisee_invoices
    SET 
        paid_amount = total_paid,
        credit_amount = total_credits,
        balance = GREATEST(0, invoice_total - total_paid - total_credits),
        payment_status = CASE
            WHEN (total_paid + total_credits) = 0 AND is_overdue THEN 'overdue'
            WHEN (total_paid + total_credits) = 0 THEN 'unpaid'
            WHEN (total_paid + total_credits) < invoice_total AND is_overdue THEN 'overdue'
            WHEN (total_paid + total_credits) < invoice_total THEN 'partial'
            ELSE 'paid'
        END,
        updated_at = NOW()
    WHERE id = v_invoice_id;

    -- HANDLE OVERPAYMENT -> Convert to credit
    v_excess_payment := total_paid + total_credits - invoice_total;
    
    IF v_excess_payment > 0 THEN
        INSERT INTO franchisee_credits (
            franchisee_id,
            people_branches_id,
            amount,
            remaining_amount,
            source_type,
            source_invoice_id,
            notes
        ) VALUES (
            v_franchisee_id,
            v_people_branches_id,
            v_excess_payment,
            v_excess_payment,
            'overpayment',
            v_invoice_id,
            'Auto-generated from overpayment on invoice ' || v_invoice_id
        )
        ON CONFLICT (source_invoice_id) WHERE source_type = 'overpayment' 
        DO UPDATE SET 
            amount = EXCLUDED.amount,
            remaining_amount = EXCLUDED.amount - franchisee_credits.used_amount,
            updated_at = NOW();
    END IF;
    
    RETURN NULL;
END;
$function$;
