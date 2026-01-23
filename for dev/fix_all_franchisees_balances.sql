-- ============================================================================
-- Fix ALL Franchisees' Invoice Balances and Previous Balance
-- ============================================================================
-- Description: Recalculates all invoice balances and previous_balance for
--              ALL franchisees in the system to fix any inconsistencies
-- Date: 2026-01-21
-- ============================================================================

BEGIN;

-- Step 1: Recalculate ALL invoices for ALL franchisees
DO $$
DECLARE
    v_invoice RECORD;
    v_total_paid NUMERIC;
    v_total_credits NUMERIC;
    v_new_balance NUMERIC;
    v_new_status VARCHAR(20);
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting recalculation of ALL invoices...';
    RAISE NOTICE '';
    
    FOR v_invoice IN 
        SELECT id, invoice_number, total_amount
        FROM franchisee_invoices
        ORDER BY created_at
    LOOP
        -- Get total cash/cheque paid
        SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
        FROM franchisee_invoice_payments
        WHERE invoice_id = v_invoice.id;

        -- Get total credit applied
        SELECT COALESCE(SUM(amount_applied), 0) INTO v_total_credits
        FROM credit_applications
        WHERE invoice_id = v_invoice.id;
        
        v_new_balance := GREATEST(0, v_invoice.total_amount - v_total_paid - v_total_credits);
        
        -- Determine payment status
        IF (v_total_paid + v_total_credits) = 0 THEN
            v_new_status := 'unpaid';
        ELSIF (v_total_paid + v_total_credits) < v_invoice.total_amount THEN
            v_new_status := 'partial';
        ELSE
            v_new_status := 'paid';
        END IF;
        
        -- Update the invoice
        UPDATE franchisee_invoices
        SET 
            paid_amount = v_total_paid,
            credit_amount = v_total_credits,
            balance = v_new_balance,
            payment_status = v_new_status,
            updated_at = NOW()
        WHERE id = v_invoice.id;
        
        v_count := v_count + 1;
        
        -- Progress indicator every 50 invoices
        IF v_count % 50 = 0 THEN
            RAISE NOTICE 'Processed % invoices...', v_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Recalculation complete! Total invoices processed: %', v_count;
END $$;

-- Step 2: Recalculate previous_balance for ALL invoices
DO $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Updating previous_balance for all invoices...';
    
    UPDATE franchisee_invoices fi
    SET previous_balance = (
        SELECT COALESCE(SUM(balance), 0)
        FROM franchisee_invoices fi2
        WHERE fi2.people_branches_id = fi.people_branches_id
            AND fi2.payment_status IN ('unpaid', 'partial', 'overdue')
            AND fi2.status != 'cancelled'
            AND fi2.balance > 0
            AND fi2.period_start < fi.period_start
    );
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Updated previous_balance for % invoices', v_updated_count;
END $$;

-- Step 3: Show summary of fixes
DO $$
DECLARE
    v_total_invoices INTEGER;
    v_paid_invoices INTEGER;
    v_unpaid_invoices INTEGER;
    v_invoices_with_arrears INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Summary of All Invoices:';
    RAISE NOTICE '====================================================';
    
    SELECT COUNT(*) INTO v_total_invoices FROM franchisee_invoices;
    SELECT COUNT(*) INTO v_paid_invoices FROM franchisee_invoices WHERE payment_status = 'paid';
    SELECT COUNT(*) INTO v_unpaid_invoices FROM franchisee_invoices WHERE payment_status IN ('unpaid', 'partial', 'overdue');
    SELECT COUNT(*) INTO v_invoices_with_arrears FROM franchisee_invoices WHERE previous_balance > 0;
    
    RAISE NOTICE 'Total Invoices: %', v_total_invoices;
    RAISE NOTICE 'Paid Invoices: %', v_paid_invoices;
    RAISE NOTICE 'Unpaid/Partial Invoices: %', v_unpaid_invoices;
    RAISE NOTICE 'Invoices with Previous Balance: %', v_invoices_with_arrears;
    RAISE NOTICE '====================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All franchisee invoice balances have been corrected!';
    RAISE NOTICE '====================================================';
END $$;

COMMIT;

-- Optional: View invoices with incorrect arrears (should be none after fix)
SELECT 
    fi.invoice_number,
    p.name as franchisee_name,
    b.name as branch_name,
    fi.payment_status,
    fi.balance as current_balance,
    fi.previous_balance as arrears,
    (fi.balance + fi.previous_balance) as total_due
FROM franchisee_invoices fi
JOIN people p ON fi.franchisee_id = p.id
LEFT JOIN branches b ON fi.branch_id = b.id
WHERE fi.payment_status = 'paid' 
  AND fi.previous_balance > 0  -- Paid invoices shouldn't have arrears showing on next invoice
ORDER BY fi.period_start DESC
LIMIT 10;
