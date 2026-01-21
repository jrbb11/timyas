-- ============================================================================
-- Fix Payment Constraint Error - Migration Script
-- ============================================================================
-- Description: Adds unique constraint to franchisee_credits table to allow
--              ON CONFLICT clause in update_franchisee_invoice_payment_status
--              trigger function. This prevents duplicate overpayment credits.
-- Date: 2026-01-21
-- Issue: "Error recording payment: there is no unique or exclusion constraint
--         matching the ON CONFLICT specification"
-- ============================================================================

BEGIN;

-- Step 1: Check for existing duplicate overpayment credits
-- This query will show if there are any duplicates that would violate the constraint
DO $$
DECLARE
    v_duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_duplicate_count
    FROM (
        SELECT source_invoice_id, COUNT(*) as count
        FROM franchisee_credits
        WHERE source_type = 'overpayment' 
          AND source_invoice_id IS NOT NULL
        GROUP BY source_invoice_id
        HAVING COUNT(*) > 1
    ) duplicates;

    IF v_duplicate_count > 0 THEN
        RAISE NOTICE 'Found % invoices with duplicate overpayment credits', v_duplicate_count;
        RAISE NOTICE 'Consolidating duplicate credits...';
        
        -- Consolidate duplicates: keep the most recent, sum the amounts
        WITH ranked_credits AS (
            SELECT 
                id,
                source_invoice_id,
                franchisee_id,
                people_branches_id,
                amount,
                used_amount,
                remaining_amount,
                created_at,
                ROW_NUMBER() OVER (PARTITION BY source_invoice_id ORDER BY created_at DESC) as rn
            FROM franchisee_credits
            WHERE source_type = 'overpayment' 
              AND source_invoice_id IS NOT NULL
        ),
        duplicates AS (
            SELECT 
                source_invoice_id,
                franchisee_id,
                people_branches_id,
                SUM(amount) as total_amount,
                SUM(used_amount) as total_used,
                SUM(remaining_amount) as total_remaining,
                MIN(created_at) as first_created
            FROM ranked_credits
            WHERE source_invoice_id IN (
                SELECT source_invoice_id 
                FROM ranked_credits 
                GROUP BY source_invoice_id 
                HAVING COUNT(*) > 1
            )
            GROUP BY source_invoice_id, franchisee_id, people_branches_id
        ),
        keep_ids AS (
            SELECT id, source_invoice_id
            FROM ranked_credits
            WHERE rn = 1  -- Keep the most recent one
        )
        -- Update the most recent credit with consolidated amounts
        UPDATE franchisee_credits fc
        SET 
            amount = d.total_amount,
            used_amount = d.total_used,
            remaining_amount = d.total_remaining,
            notes = 'Consolidated from duplicate overpayment credits - ' || COALESCE(fc.notes, ''),
            updated_at = NOW()
        FROM duplicates d
        JOIN keep_ids k ON k.source_invoice_id = d.source_invoice_id
        WHERE fc.id = k.id;

        -- Delete the old duplicates (keeping only the consolidated one)
        WITH ranked_credits AS (
            SELECT 
                id,
                source_invoice_id,
                ROW_NUMBER() OVER (PARTITION BY source_invoice_id ORDER BY created_at DESC) as rn
            FROM franchisee_credits
            WHERE source_type = 'overpayment' 
              AND source_invoice_id IS NOT NULL
        )
        DELETE FROM franchisee_credits
        WHERE id IN (
            SELECT id 
            FROM ranked_credits 
            WHERE rn > 1  -- Delete all but the most recent
        );
          
        RAISE NOTICE 'Duplicate credits consolidated successfully';
    ELSE
        RAISE NOTICE 'No duplicate overpayment credits found';
    END IF;
END $$;

-- Step 2: Create unique partial index for overpayment credits
-- This allows ON CONFLICT clause to work properly
DROP INDEX IF EXISTS idx_franchisee_credits_unique_overpayment;

CREATE UNIQUE INDEX idx_franchisee_credits_unique_overpayment
ON public.franchisee_credits (source_invoice_id)
WHERE source_type = 'overpayment' AND source_invoice_id IS NOT NULL;

-- Log success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Unique index created successfully';
END $$;

-- Step 3: Verify the constraint exists
DO $$
DECLARE
    v_index_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'franchisee_credits' 
          AND indexname = 'idx_franchisee_credits_unique_overpayment'
    ) INTO v_index_exists;
    
    IF v_index_exists THEN
        RAISE NOTICE '✓ Constraint verified: idx_franchisee_credits_unique_overpayment exists';
    ELSE
        RAISE EXCEPTION 'Constraint creation failed!';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- Migration Complete
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'The payment constraint error should now be resolved.';
    RAISE NOTICE 'You can now record overpayments without errors.';
    RAISE NOTICE '====================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Please verify the constraint exists:';
    RAISE NOTICE 'SELECT indexname FROM pg_indexes WHERE tablename = ''franchisee_credits'' AND indexname = ''idx_franchisee_credits_unique_overpayment'';';
END $$;
