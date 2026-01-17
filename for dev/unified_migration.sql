-- ============================================
-- UNIFIED FRANCHISEE INVOICING & CREDIT FIX
-- Migration: Fixes Negative Balances & Installs Credit System
-- Created: 2026-01-17
-- ============================================

BEGIN;

-- 1. ENSURE CREDIT TABLES EXIST
CREATE TABLE IF NOT EXISTS public.franchisee_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisee_id UUID REFERENCES people(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(14, 2) NOT NULL CHECK (amount > 0),
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('overpayment', 'return', 'adjustment', 'manual')),
  source_invoice_id UUID REFERENCES franchisee_invoices(id) ON DELETE SET NULL,
  used_amount DECIMAL(14, 2) DEFAULT 0 CHECK (used_amount >= 0),
  remaining_amount DECIMAL(14, 2) NOT NULL CHECK (remaining_amount >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_amounts CHECK (used_amount <= amount AND remaining_amount = amount - used_amount)
);

CREATE TABLE IF NOT EXISTS public.credit_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID REFERENCES franchisee_credits(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES franchisee_invoices(id) ON DELETE CASCADE NOT NULL,
  amount_applied DECIMAL(14, 2) NOT NULL CHECK (amount_applied > 0),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FIX PAYMENT STATUS & BALANCE CALCULATION FUNCTION
-- This version accounts for applied credits and prevents negative balances
CREATE OR REPLACE FUNCTION public.update_franchisee_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id UUID;
    total_paid NUMERIC;
    total_credits NUMERIC;
    invoice_total NUMERIC;
    invoice_due_date DATE;
    is_overdue BOOLEAN;
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
    
    -- Get invoice total and due date
    SELECT total_amount, due_date INTO invoice_total, invoice_due_date
    FROM franchisee_invoices
    WHERE id = v_invoice_id;
    
    -- Check if overdue (balance > 0 and past due date)
    is_overdue := (CURRENT_DATE > invoice_due_date) AND ((total_paid + total_credits) < invoice_total);
    
    -- Update payment status and balance
    -- GREATEST(0, ...) ensures we never show a negative balance
    UPDATE franchisee_invoices
    SET 
        paid_amount = total_paid,
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
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Re-create trigger if needed (it should already point to the updated function)
DROP TRIGGER IF EXISTS trg_update_franchisee_invoice_payment_status ON franchisee_invoice_payments;
CREATE TRIGGER trg_update_franchisee_invoice_payment_status
    AFTER INSERT OR UPDATE OR DELETE ON franchisee_invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_franchisee_invoice_payment_status();

-- 3. DATA CLEANUP: CONVERT EXISTING OVERPAYMENTS TO CREDITS
-- This script finds invoices where paid_amount > total_amount (resulting in negative balance)
-- and automatically converts the excess into usable credits.

DO $$
DECLARE
    v_record RECORD;
    v_excess NUMERIC;
    v_credit_id UUID;
BEGIN
    FOR v_record IN 
        SELECT id, franchisee_id, total_amount, paid_amount, (paid_amount - total_amount) as excess
        FROM franchisee_invoices
        WHERE (paid_amount - total_amount) > 0
    LOOP
        -- 1. Create a credit record for the excess amount
        INSERT INTO franchisee_credits (
            franchisee_id, 
            amount, 
            source_type, 
            source_invoice_id, 
            remaining_amount, 
            notes
        ) 
        VALUES (
            v_record.franchisee_id, 
            v_record.excess, 
            'overpayment', 
            v_record.id, 
            v_record.excess, 
            'Automatic credit from overpayment on invoice ' || v_record.id
        )
        RETURNING id INTO v_credit_id;

        -- 2. Update the invoice to set paid_amount equal to total_amount
        -- (The excess is now safely in the credits table)
        UPDATE franchisee_invoices
        SET 
            paid_amount = total_amount,
            balance = 0,
            payment_status = 'paid',
            updated_at = NOW()
        WHERE id = v_record.id;

        RAISE NOTICE 'Converted overpayment of % for invoice % into credit %', v_record.excess, v_record.id, v_credit_id;
    END LOOP;
END $$;

-- 4. UPDATE GRANTS
GRANT ALL ON public.franchisee_credits TO authenticated;
GRANT ALL ON public.credit_applications TO authenticated;

COMMIT;
