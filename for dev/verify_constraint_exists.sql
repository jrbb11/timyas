-- ============================================================================
-- VERIFY THE FIX WAS APPLIED
-- ============================================================================
-- Run this to check if the constraint exists in the database
-- that your web application is using
-- ============================================================================

-- Check 1: Does the unique index exist?
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'franchisee_credits' 
    AND indexname = 'idx_franchisee_credits_unique_overpayment';

-- Expected: Should return 1 row
-- If it returns EMPTY, the constraint was NOT created!

-- Check 2: Which database are you connected to?
SELECT current_database();

-- Check 3: Show all indexes on franchisee_credits table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'franchisee_credits';
