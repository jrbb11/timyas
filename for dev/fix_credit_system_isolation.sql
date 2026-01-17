-- ========================================================
-- MIGRATION: CREDIT SYSTEM ALIGNMENT & BRANCH ISOLATION
-- ========================================================
-- This script aligns the credit system with the multi-branch 
-- structure and fixes the "trigger gaps".

BEGIN;

-- 1. Update Invoices Table
ALTER TABLE public.franchisee_invoices 
ADD COLUMN IF NOT EXISTS credit_amount numeric(14, 2) not null default 0;

-- 2. Update Credits Table
ALTER TABLE public.franchisee_credits 
ADD COLUMN IF NOT EXISTS people_branches_id uuid references public.people_branches(id) ON DELETE CASCADE;

-- 2.1. Link existing credits to their branch via the source invoice if possible
UPDATE public.franchisee_credits c
SET people_branches_id = i.people_branches_id
FROM public.franchisee_invoices i
WHERE c.source_invoice_id = i.id
AND c.people_branches_id IS NULL;

-- 3. Update Functions
-- --------------------------------------------------------
-- 3.1. update_franchisee_invoice_payment_status
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- 3.2. auto_apply_credits_to_invoice
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_apply_credits_to_invoice(p_invoice_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_people_branches_id UUID;
  v_invoice_balance DECIMAL(10, 2);
  v_credit_record RECORD;
  v_amount_to_apply DECIMAL(10, 2);
  v_total_applied DECIMAL(10, 2) := 0;
BEGIN
  -- Get invoice details
  SELECT people_branches_id, (total_amount - paid_amount - credit_amount) 
  INTO v_people_branches_id, v_invoice_balance
  FROM franchisee_invoices
  WHERE id = p_invoice_id;
  
  IF v_invoice_balance <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Loop through available credits for this SPECIFIC BRANCH
  FOR v_credit_record IN
    SELECT id, remaining_amount
    FROM franchisee_credits
    WHERE people_branches_id = v_people_branches_id
      AND remaining_amount > 0
    ORDER BY created_at ASC
  LOOP
    v_amount_to_apply := LEAST(v_credit_record.remaining_amount, v_invoice_balance);
    PERFORM apply_credit_to_invoice(v_credit_record.id, p_invoice_id, v_amount_to_apply);
    v_total_applied := v_total_applied + v_amount_to_apply;
    v_invoice_balance := v_invoice_balance - v_amount_to_apply;
    EXIT WHEN v_invoice_balance <= 0;
  END LOOP;
  
  RETURN v_total_applied;
END;
$function$;

-- --------------------------------------------------------
-- 3.3. get_franchisee_available_credit
-- --------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_franchisee_available_credit(uuid);
CREATE OR REPLACE FUNCTION public.get_franchisee_available_credit(p_people_branches_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_credit DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(remaining_amount), 0)
  INTO total_credit
  FROM franchisee_credits
  WHERE people_branches_id = p_people_branches_id
    AND remaining_amount > 0;
  
  RETURN total_credit;
END;
$function$;

-- 4. Install Credit Application Trigger
-- --------------------------------------------------------
DROP TRIGGER IF EXISTS trg_on_credit_application_change ON public.credit_applications;
CREATE TRIGGER trg_on_credit_application_change
AFTER INSERT OR UPDATE OR DELETE ON public.credit_applications
FOR EACH ROW
EXECUTE FUNCTION update_franchisee_invoice_payment_status();

COMMIT;
