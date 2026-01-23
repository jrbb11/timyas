-- ============================================================================
-- VERIFY OVERPAYMENT CREDIT WAS CREATED
-- ============================================================================
-- Check if the ₱1,000 overpayment credit was automatically created
-- for Invoice FINV-202601-000051 after the ₱23,000 payment
-- ============================================================================

-- Check 1: Find the overpayment credit for this invoice
SELECT 
    fc.id,
    fc.amount,
    fc.remaining_amount,
    fc.used_amount,
    fc.source_type,
    fc.notes,
    fc.created_at,
    fi.invoice_number,
    fi.total_amount as invoice_total
FROM franchisee_credits fc
JOIN franchisee_invoices fi ON fc.source_invoice_id = fi.id
WHERE fi.invoice_number = 'FINV-202601-000051'
    AND fc.source_type = 'overpayment';

-- Expected: Should show a credit with amount = 1000.00

-- Check 2: Show invoice details after payment
SELECT 
    invoice_number,
    total_amount,
    paid_amount,
    credit_amount,
    balance,
    payment_status
FROM franchisee_invoices
WHERE invoice_number = 'FINV-202601-000051';

-- Expected: 
-- total_amount = 22000
-- paid_amount = 23000
-- balance = 0
-- payment_status = 'paid'
