-- ============================================================================
-- Investigate and Fix Previous Balance Issue
-- ============================================================================
-- Description: Investigates why Invoice 53 (May 2025) shows ₱10,650 as
--              previous balance when Invoice 52 (April 2025) is fully paid
-- Date: 2026-01-21
-- ============================================================================

-- Step 1: Find Rea Ann De Luna's invoices
SELECT 
    fi.invoice_number,
    fi.period_start,
    fi.period_end,
    fi.total_amount as new_charges,
    fi.paid_amount,
    fi.credit_amount,
    fi.balance as current_balance,
    fi.previous_balance as arrears,
    fi.payment_status,
    fi.status,
    p.name as franchisee_name,
    b.name as branch_name
FROM franchisee_invoices fi
JOIN people p ON fi.franchisee_id = p.id
LEFT JOIN branches b ON fi.branch_id = b.id
WHERE p.name ILIKE '%Rea Ann%De Luna%'
ORDER BY fi.period_start DESC;

-- Step 2: Check April 2025 invoice details (should be fully paid)
SELECT 
    fi.invoice_number,
    fi.invoice_date,
    fi.period_start,
    fi.period_end,
    fi.total_amount,
    fi.paid_amount,
    fi.credit_amount,
    fi.balance,
    fi.previous_balance,
    fi.payment_status,
    fi.status
FROM franchisee_invoices fi
JOIN people p ON fi.franchisee_id = p.id
WHERE p.name ILIKE '%Rea Ann%De Luna%'
    AND fi.period_start >= '2025-04-01' 
    AND fi.period_start < '2025-05-01';

-- Step 3: Check all payments for April invoice
SELECT 
    fip.payment_date,
    fip.amount,
    pm.name as payment_method,
    fip.reference_number,
    fip.notes,
    fi.invoice_number
FROM franchisee_invoice_payments fip
JOIN franchisee_invoices fi ON fip.invoice_id = fi.id
JOIN people p ON fi.franchisee_id = p.id
LEFT JOIN payment_methods pm ON fip.payment_method_id = pm.id
WHERE p.name ILIKE '%Rea Ann%De Luna%'
    AND fi.period_start >= '2025-04-01' 
    AND fi.period_start < '2025-05-01'
ORDER BY fip.payment_date;

-- Step 4: Check credit applications for April invoice
SELECT 
    ca.applied_at,
    ca.amount_applied,
    fc.source_type,
    fc.notes as credit_notes,
    fi.invoice_number
FROM credit_applications ca
JOIN franchisee_credits fc ON ca.credit_id = fc.id
JOIN franchisee_invoices fi ON ca.invoice_id = fi.id
JOIN people p ON fi.franchisee_id = p.id
WHERE p.name ILIKE '%Rea Ann%De Luna%'
    AND fi.period_start >= '2025-04-01' 
    AND fi.period_start < '2025-05-01'
ORDER BY ca.applied_at;

-- Step 5: RECALCULATE all invoices for Rea Ann De Luna to fix any inconsistencies
DO $$
DECLARE
    v_invoice RECORD;
    v_total_paid NUMERIC;
    v_total_credits NUMERIC;
    v_invoice_total NUMERIC;
    v_new_balance NUMERIC;
    v_new_status VARCHAR(20);
BEGIN
    RAISE NOTICE 'Recalculating invoice balances for Rea Ann De Luna...';
    
    FOR v_invoice IN 
        SELECT fi.id, fi.invoice_number, fi.total_amount
        FROM franchisee_invoices fi
        JOIN people p ON fi.franchisee_id = p.id
        WHERE p.name ILIKE '%Rea Ann%De Luna%'
        ORDER BY fi.period_start
    LOOP
        -- Get total cash/cheque paid
        SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
        FROM franchisee_invoice_payments
        WHERE invoice_id = v_invoice.id;

        -- Get total credit applied
        SELECT COALESCE(SUM(amount_applied), 0) INTO v_total_credits
        FROM credit_applications
        WHERE invoice_id = v_invoice.id;
        
        v_invoice_total := v_invoice.total_amount;
        v_new_balance := GREATEST(0, v_invoice_total - v_total_paid - v_total_credits);
        
        -- Determine payment status
        IF (v_total_paid + v_total_credits) = 0 THEN
            v_new_status := 'unpaid';
        ELSIF (v_total_paid + v_total_credits) < v_invoice_total THEN
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
        
        RAISE NOTICE 'Invoice %: Total=%, Paid=%, Credit=%, NewBalance=%, Status=%', 
            v_invoice.invoice_number, v_invoice_total, v_total_paid, v_total_credits, v_new_balance, v_new_status;
    END LOOP;
    
    RAISE NOTICE 'Recalculation complete!';
END $$;

-- Step 6: Recalculate previous_balance for May 2025 invoice
DO $$
DECLARE
    v_may_invoice_id UUID;
    v_people_branches_id UUID;
    v_new_previous_balance NUMERIC := 0;
BEGIN
    -- Get May 2025 invoice ID
    SELECT fi.id, fi.people_branches_id 
    INTO v_may_invoice_id, v_people_branches_id
    FROM franchisee_invoices fi
    JOIN people p ON fi.franchisee_id = p.id
    WHERE p.name ILIKE '%Rea Ann%De Luna%'
        AND fi.period_start >= '2025-05-01' 
        AND fi.period_start < '2025-06-01';
    
    IF v_may_invoice_id IS NOT NULL THEN
        -- Calculate what the previous balance SHOULD be
        SELECT COALESCE(SUM(balance), 0) INTO v_new_previous_balance
        FROM franchisee_invoices
        WHERE people_branches_id = v_people_branches_id
            AND payment_status IN ('unpaid', 'partial', 'overdue')
            AND status != 'cancelled'
            AND balance > 0
            AND period_start < '2025-05-01';  -- Before May
        
        -- Update the May invoice
        UPDATE franchisee_invoices
        SET previous_balance = v_new_previous_balance,
            updated_at = NOW()
        WHERE id = v_may_invoice_id;
        
        RAISE NOTICE 'Updated May 2025 invoice - New previous_balance: %', v_new_previous_balance;
    ELSE
        RAISE NOTICE 'May 2025 invoice not found for Rea Ann De Luna';
    END IF;
END $$;

-- Step 7: Final verification - show all invoices after correction
SELECT 
    fi.invoice_number,
    fi.period_start,
    fi.period_end,
    fi.total_amount as new_charges,
    fi.paid_amount,
    fi.credit_amount,
    fi.balance as current_balance,
    fi.previous_balance as arrears,
    (fi.balance + fi.previous_balance) as total_due,
    fi.payment_status,
    fi.status
FROM franchisee_invoices fi
JOIN people p ON fi.franchisee_id = p.id
WHERE p.name ILIKE '%Rea Ann%De Luna%'
ORDER BY fi.period_start;

RAISE NOTICE '====================================================';
RAISE NOTICE 'Investigation and correction complete!';
RAISE NOTICE 'Please verify that April invoice shows balance=0';
RAISE NOTICE 'and May invoice shows previous_balance=0';
RAISE NOTICE '====================================================';
