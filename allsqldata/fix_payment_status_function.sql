-- =====================================================
-- FIX: Update Franchisee Invoice Payment Status Function
-- =====================================================
-- This fixes the "missing FROM-clause entry" error by using
-- a local variable instead of the function name

CREATE OR REPLACE FUNCTION update_franchisee_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id UUID;
    total_paid NUMERIC;
    invoice_total NUMERIC;
    invoice_due_date DATE;
    is_overdue BOOLEAN;
BEGIN
    v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Get total paid for this invoice
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM franchisee_invoice_payments
    WHERE invoice_id = v_invoice_id;
    
    -- Get invoice total and due date
    SELECT total_amount, due_date INTO invoice_total, invoice_due_date
    FROM franchisee_invoices
    WHERE id = v_invoice_id;
    
    -- Check if overdue
    is_overdue := (CURRENT_DATE > invoice_due_date) AND (total_paid < invoice_total);
    
    -- Update payment status and balance
    UPDATE franchisee_invoices
    SET 
        paid_amount = total_paid,
        balance = invoice_total - total_paid,
        payment_status = CASE
            WHEN total_paid = 0 AND is_overdue THEN 'overdue'
            WHEN total_paid = 0 THEN 'unpaid'
            WHEN total_paid < invoice_total AND is_overdue THEN 'overdue'
            WHEN total_paid < invoice_total THEN 'partial'
            ELSE 'paid'
        END,
        updated_at = NOW()
    WHERE id = v_invoice_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
