-- ============================================================================
-- Quick Test Script - Payment Constraint Fix
-- ============================================================================
-- Run this script to quickly test if the fix is working
-- ============================================================================

BEGIN;

-- 1. Check if constraint exists
DO $$
DECLARE
    v_constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'franchisee_credits' 
          AND indexname = 'idx_franchisee_credits_unique_overpayment'
    ) INTO v_constraint_exists;
    
    IF v_constraint_exists THEN
        RAISE NOTICE '✓ PASS: Unique constraint exists';
    ELSE
        RAISE EXCEPTION '✗ FAIL: Unique constraint does not exist - run migration script first!';
    END IF;
END $$;

-- 2. Test ON CONFLICT works (simulation)
DO $$
DECLARE
    v_test_franchisee_id UUID;
    v_test_branch_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Testing ON CONFLICT clause...';
    
    -- Get a real franchisee for testing
    SELECT id INTO v_test_franchisee_id
    FROM people
    WHERE person_type = 'franchisee'
    LIMIT 1;
    
    SELECT id INTO v_test_branch_id
    FROM people_branches
    WHERE person_id = v_test_franchisee_id
    LIMIT 1;
    
    IF v_test_franchisee_id IS NOT NULL AND v_test_branch_id IS NOT NULL THEN
        -- Create a test invoice
        WITH test_invoice AS (
            INSERT INTO franchisee_invoices (
                people_branches_id,
                branch_id,
                franchisee_id,
                invoice_date,
                period_start,
                period_end,
                due_date,
                total_amount,
                balance,
                status,
                payment_status
            ) VALUES (
                v_test_branch_id,
                (SELECT branch_id FROM people_branches WHERE id = v_test_branch_id),
                v_test_franchisee_id,
                CURRENT_DATE,
                CURRENT_DATE - INTERVAL '1 month',
                CURRENT_DATE,
                CURRENT_DATE + INTERVAL '30 days',
                1000.00,
                1000.00,
                'draft',
                'unpaid'
            )
            RETURNING id
        )
        -- First insert - should succeed
        INSERT INTO franchisee_credits (
            franchisee_id,
            people_branches_id,
            amount,
            remaining_amount,
            source_type,
            source_invoice_id,
            notes
        )
        SELECT 
            v_test_franchisee_id,
            v_test_branch_id,
            100.00,
            100.00,
            'overpayment',
            test_invoice.id,
            'TEST CREDIT 1'
        FROM test_invoice;
        
        RAISE NOTICE '  - First insert succeeded';
        
        -- Second insert with same invoice (should update, not insert)
        WITH test_invoice AS (
            SELECT id 
            FROM franchisee_invoices 
            WHERE franchisee_id = v_test_franchisee_id
                AND status = 'draft'
                AND notes IS NULL
            ORDER BY created_at DESC 
            LIMIT 1
        )
        INSERT INTO franchisee_credits (
            franchisee_id,
            people_branches_id,
            amount,
            remaining_amount,
            source_type,
            source_invoice_id,
            notes
        )
        SELECT 
            v_test_franchisee_id,
            v_test_branch_id,
            200.00,
            200.00,
            'overpayment',
            test_invoice.id,
            'TEST CREDIT 2 - UPDATED'
        FROM test_invoice
        ON CONFLICT (source_invoice_id) WHERE source_type = 'overpayment'
        DO UPDATE SET 
            amount = EXCLUDED.amount,
            remaining_amount = EXCLUDED.remaining_amount,
            notes = EXCLUDED.notes,
            updated_at = NOW();
        
        RAISE NOTICE '  - ON CONFLICT update succeeded';
        
        -- Verify only one credit exists for this test invoice
        IF (
            SELECT COUNT(*) 
            FROM franchisee_credits fc
            JOIN franchisee_invoices fi ON fc.source_invoice_id = fi.id
            WHERE fi.franchisee_id = v_test_franchisee_id
                AND fi.status = 'draft'
                AND fi.notes IS NULL
                AND fc.source_type = 'overpayment'
        ) = 1 THEN
            RAISE NOTICE '✓ PASS: ON CONFLICT works correctly (no duplicates)';
        ELSE
            RAISE EXCEPTION '✗ FAIL: Duplicate credits found!';
        END IF;
        
        -- Cleanup test data
        DELETE FROM franchisee_invoices 
        WHERE franchisee_id = v_test_franchisee_id
            AND status = 'draft'
            AND notes IS NULL;
            
    ELSE
        RAISE NOTICE '⚠ SKIP: No test franchisee found';
    END IF;
END $$;

-- 3. Check for any existing duplicates
DO $$
DECLARE
    v_duplicate_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Checking for duplicate overpayment credits...';
    
    SELECT COUNT(*) INTO v_duplicate_count
    FROM (
        SELECT source_invoice_id
        FROM franchisee_credits
        WHERE source_type = 'overpayment' 
            AND source_invoice_id IS NOT NULL
        GROUP BY source_invoice_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF v_duplicate_count = 0 THEN
        RAISE NOTICE '✓ PASS: No duplicate overpayment credits found';
    ELSE
        RAISE WARNING '✗ FAIL: Found % invoices with duplicate credits', v_duplicate_count;
        RAISE NOTICE 'Run fix_payment_constraint_error.sql to consolidate duplicates';
    END IF;
END $$;

-- 4. Test trigger function
DO $$
DECLARE
    v_test_franchisee_id UUID;
    v_test_branch_id UUID;
    v_test_invoice_id UUID;
    v_credit_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Testing trigger function...';
    
    -- Get a test franchisee
    SELECT id INTO v_test_franchisee_id
    FROM people
    WHERE person_type = 'franchisee'
    LIMIT 1;
    
    SELECT id INTO v_test_branch_id
    FROM people_branches
    WHERE person_id = v_test_franchisee_id
    LIMIT 1;
    
    IF v_test_franchisee_id IS NOT NULL AND v_test_branch_id IS NOT NULL THEN
        -- Create test invoice
        INSERT INTO franchisee_invoices (
            people_branches_id,
            branch_id,
            franchisee_id,
            invoice_date,
            period_start,
            period_end,
            due_date,
            total_amount,
            balance,
            status,
            payment_status
        ) VALUES (
            v_test_branch_id,
            (SELECT branch_id FROM people_branches WHERE id = v_test_branch_id),
            v_test_franchisee_id,
            CURRENT_DATE,
            CURRENT_DATE - INTERVAL '1 month',
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '30 days',
            1000.00,
            1000.00,
            'draft',
            'unpaid'
        )
        RETURNING id INTO v_test_invoice_id;
        
        -- Record overpayment
        INSERT INTO franchisee_invoice_payments (
            invoice_id,
            amount,
            payment_date,
            account_id
        ) VALUES (
            v_test_invoice_id,
            1500.00,  -- Overpayment of 500
            CURRENT_DATE,
            1
        );
        
        -- Trigger should have created credit
        SELECT COUNT(*) INTO v_credit_count
        FROM franchisee_credits
        WHERE source_invoice_id = v_test_invoice_id
            AND source_type = 'overpayment';
        
        IF v_credit_count = 1 THEN
            RAISE NOTICE '✓ PASS: Trigger created overpayment credit';
        ELSE
            RAISE EXCEPTION '✗ FAIL: Trigger did not create credit (count: %)', v_credit_count;
        END IF;
        
        -- Record another payment (should update existing credit)
        INSERT INTO franchisee_invoice_payments (
            invoice_id,
            amount,
            payment_date,
            account_id
        ) VALUES (
            v_test_invoice_id,
            200.00,  -- Now total overpayment is 700
            CURRENT_DATE,
            1
        );
        
        -- Should still be only 1 credit
        SELECT COUNT(*) INTO v_credit_count
        FROM franchisee_credits
        WHERE source_invoice_id = v_test_invoice_id
            AND source_type = 'overpayment';
        
        IF v_credit_count = 1 THEN
            RAISE NOTICE '✓ PASS: Trigger updated existing credit (no duplicate)';
        ELSE
            RAISE EXCEPTION '✗ FAIL: Duplicate credit created (count: %)', v_credit_count;
        END IF;
        
        -- Cleanup
        DELETE FROM franchisee_invoices WHERE id = v_test_invoice_id;
        
    ELSE
        RAISE NOTICE '⚠ SKIP: No test franchisee found';
    END IF;
END $$;

ROLLBACK;

RAISE NOTICE '';
RAISE NOTICE '====================================================';
RAISE NOTICE 'All Tests Completed!';
RAISE NOTICE '====================================================';
RAISE NOTICE '';
RAISE NOTICE 'If all tests passed, you are ready to:';
RAISE NOTICE '1. Record overpayments without errors';
RAISE NOTICE '2. Test with Rea Ann De Luna payment scenario';
RAISE NOTICE '';
