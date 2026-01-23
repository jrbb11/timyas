-- ============================================================================
-- CHECK FOR DUPLICATE OVERPAYMENT CREDITS
-- ============================================================================
-- This checks if there are duplicate credits that might be causing issues
-- ============================================================================

-- Check 1: Are there duplicate overpayment credits?
SELECT 
    source_invoice_id,
    COUNT(*) as credit_count,
    STRING_AGG(id::text, ', ') as credit_ids,
    STRING_AGG(amount::text, ', ') as amounts
FROM franchisee_credits
WHERE source_type = 'overpayment' 
    AND source_invoice_id IS NOT NULL
GROUP BY source_invoice_id
HAVING COUNT(*) > 1;

-- If this returns rows, you have duplicates!

-- Check 2: For the specific invoice in the error (FINV-202601-000051)
-- Find any existing credits
SELECT 
    fc.id,
    fc.franchisee_id,
    fc.source_type,
    fc.amount,
    fc.remaining_amount,
    fc.created_at,
    fi.invoice_number
FROM franchisee_credits fc
JOIN franchisee_invoices fi ON fc.source_invoice_id = fi.id
WHERE fi.invoice_number = 'FINV-202601-000051'
    AND fc.source_type = 'overpayment';

-- Check 3: Is the trigger function up to date?
SELECT 
    proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname = 'update_franchisee_invoice_payment_status'
    AND n.nspname = 'public';
