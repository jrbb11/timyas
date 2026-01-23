-- ============================================================================
-- DEPLOYMENT GUIDE - Payment Constraint Error Fix
-- ============================================================================
-- Date: 2026-01-21
-- Purpose: Fix constraint error when recording overpayments and correct
--          previous balance calculation issues
-- ============================================================================

-- IMPORTANT: Run these scripts IN ORDER on your production database

-- ============================================================================
-- STEP 1: BACKUP YOUR DATABASE
-- ============================================================================
-- Before running any migration, create a backup of your database
-- Run this command in your terminal:
-- pg_dump -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE > backup_before_payment_fix_$(date +%Y%m%d_%H%M%S).sql

-- ============================================================================
-- STEP 2: RUN THE CONSTRAINT FIX MIGRATION
-- ============================================================================
-- This adds the unique constraint needed for overpayment handling
\i fix_payment_constraint_error.sql

-- Expected output:
-- NOTICE:  No duplicate overpayment credits found
-- NOTICE:  Unique index created successfully
-- NOTICE:  ✓ Constraint verified: idx_franchisee_credits_unique_overpayment exists
-- NOTICE:  ✓ ON CONFLICT clause works correctly
-- NOTICE:  Migration completed successfully!

-- ============================================================================
-- STEP 3: UPDATE THE TRIGGER FUNCTION (Already correct, re-deploying for safety)
-- ============================================================================
\i functions/update_franchisee_invoice_payment_status.sql

-- This trigger function should now work without errors because:
-- 1. The unique constraint exists
-- 2. ON CONFLICT clause can properly identify conflicts
-- 3. Duplicate overpayment credits are prevented

-- ============================================================================
-- STEP 4: UPDATE THE INVOICE GENERATION FUNCTION
-- ============================================================================
-- This adds the extra safety check for previous balance calculation
\i functions/generate_franchisee_invoice.sql

-- ============================================================================
-- STEP 5: INVESTIGATE AND FIX EXISTING DATA ISSUES
-- ============================================================================
-- Run this to check and fix Rea Ann De Luna's invoices specifically
\i investigate_previous_balance_issue.sql

-- Expected output will show:
-- - All invoices for Rea Ann De Luna
-- - Recalculated balances
-- - Fixed previous_balance on May 2025 invoice (should be 0)

-- ============================================================================
-- STEP 6: VERIFICATION TESTS
-- ============================================================================

-- Test 1: Verify the constraint exists
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'franchisee_credits' 
    AND indexname = 'idx_franchisee_credits_unique_overpayment';

-- Expected: Should return 1 row showing the unique index

-- Test 2: Check Rea Ann De Luna's invoices are correct
SELECT 
    invoice_number,
    TO_CHAR(period_start, 'Mon YYYY') as period,
    total_amount as new_charges,
    paid_amount,
    credit_amount,
    balance as current_balance,
    previous_balance as arrears,
    payment_status
FROM franchisee_invoices fi
JOIN people p ON fi.franchisee_id = p.id
WHERE p.name ILIKE '%Rea Ann%De Luna%'
ORDER BY period_start DESC;

-- Expected results:
-- April 2025: balance = 0, payment_status = 'paid', previous_balance = (whatever was before)
-- May 2025: previous_balance = 0 (not 10,650), balance = 120,110

-- Test 3: Check for any duplicate overpayment credits
SELECT 
    source_invoice_id, 
    COUNT(*) as credit_count,
    STRING_AGG(id::text, ', ') as credit_ids
FROM franchisee_credits
WHERE source_type = 'overpayment' 
    AND source_invoice_id IS NOT NULL
GROUP BY source_invoice_id
HAVING COUNT(*) > 1;

-- Expected: No rows (no duplicates)

-- ============================================================================
-- STEP 7: TEST THE OVERPAYMENT SCENARIO
-- ============================================================================

-- Now try recording the payment that was failing before:
-- 1. Go to Rea Ann De Luna's latest invoice in the web app
-- 2. Click "Record Payment"
-- 3. Enter amount: 20000
-- 4. Date: May 10, 2025
-- 5. Payment method: Cash
-- 6. Reference: OR 2669
-- 7. Notes: "20,000 This invoice - 10,650 next invoice - 9,350"
-- 8. Click "Confirm Payment"

-- Expected: 
-- - Payment should record successfully (no constraint error)
-- - Overpayment credit of ₱9,350 should be created
-- - Invoice balance should be 0
-- - Credit should appear in franchisee's credit history

-- ============================================================================
-- STEP 8: ROLLBACK PLAN (If something goes wrong)
-- ============================================================================

-- If you need to rollback the changes:

-- 1. Restore from backup
-- psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE < backup_before_payment_fix_TIMESTAMP.sql

-- 2. OR manually remove the constraint (less recommended):
-- DROP INDEX IF EXISTS idx_franchisee_credits_unique_overpayment;

-- ============================================================================
-- POST-DEPLOYMENT CHECKLIST
-- ============================================================================

-- [ ] Backup created
-- [ ] Migration script ran successfully
-- [ ] Trigger function updated
-- [ ] Invoice generation function updated
-- [ ] Existing data issues fixed
-- [ ] Verification tests passed
-- [ ] Overpayment test completed successfully
-- [ ] No constraint errors when recording payments
-- [ ] Previous balance calculations are correct

-- ============================================================================
-- NOTES
-- ============================================================================

-- What this fix does:
-- 1. Adds a unique constraint on franchisee_credits to prevent duplicate 
--    overpayment credits for the same invoice
-- 2. Allows the ON CONFLICT clause in the trigger to work properly
-- 3. Ensures previous_balance only includes invoices with actual outstanding balance
-- 4. Fixes any existing data issues with Rea Ann De Luna's invoices

-- What you can do after this fix:
-- 1. Record payments larger than the invoice amount
-- 2. Overpayments automatically convert to credits
-- 3. Credits automatically apply to future invoices
-- 4. No duplicate credit entries
-- 5. Accurate previous balance calculations

RAISE NOTICE '====================================================';
RAISE NOTICE 'Deployment Guide Complete';
RAISE NOTICE '';
RAISE NOTICE 'Next Steps:';
RAISE NOTICE '1. Create database backup';
RAISE NOTICE '2. Run the migration scripts in order';
RAISE NOTICE '3. Test with Rea Ann De Luna payment scenario';
RAISE NOTICE '====================================================';
