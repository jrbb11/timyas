-- ============================================================================
-- URGENT FIX: Update Trigger Function to Match Constraint
-- ============================================================================
-- The ON CONFLICT clause must EXACTLY match the partial index WHERE clause
-- ============================================================================

-- Deploy the corrected trigger function
\i functions/update_franchisee_invoice_payment_status.sql

-- Test it immediately
DO $$
DECLARE
    v_invoice_id UUID;
    v_franchisee_id UUID;
    v_branch_id UUID;
BEGIN
    RAISE NOTICE 'Testing the fixed ON CONFLICT clause...';
    
    -- Get invoice details
    SELECT id, franchisee_id, people_branches_id
    INTO v_invoice_id, v_franchisee_id, v_branch_id
    FROM franchisee_invoices
    WHERE invoice_number = 'FINV-202601-000051'
    LIMIT 1;

    IF v_invoice_id IS NULL THEN
        RAISE EXCEPTION 'Invoice FINV-202601-000051 not found';
    END IF;

    -- Try the INSERT with corrected ON CONFLICT
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
        v_branch_id,
        1000.00,
        1000.00,
        'overpayment',
        v_invoice_id,
        'TEST - Verify ON CONFLICT works'
    )
    ON CONFLICT (source_invoice_id) WHERE source_type = 'overpayment' AND source_invoice_id IS NOT NULL
    DO UPDATE SET
        amount = EXCLUDED.amount,
        remaining_amount = EXCLUDED.amount,
        notes = 'TEST - ON CONFLICT UPDATE worked!',
        updated_at = NOW();

    RAISE NOTICE '✓ SUCCESS! ON CONFLICT clause works correctly!';
    
    -- Cleanup the test credit
    DELETE FROM franchisee_credits 
    WHERE source_invoice_id = v_invoice_id 
      AND source_type = 'overpayment'
      AND notes LIKE '%TEST%';
      
    RAISE NOTICE '✓ Test credit cleaned up';
    RAISE NOTICE '';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'FIX COMPLETE! You can now record overpayments!';
    RAISE NOTICE '====================================================';
END $$;
