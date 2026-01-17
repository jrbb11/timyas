-- ==========================================
-- BACKFILL ARREARS FOR EXISTING INVOICES
-- ==========================================
-- This script calculates the historical unpaid balance for each branch
-- and populates the 'previous_balance' field in the franchisee_invoices table.

WITH arrears_calc AS (
    SELECT 
        id,
        people_branches_id,
        invoice_date,
        created_at,
        -- Calculate sum of balance of all invoices appearing BEFORE this one (by date and creation)
        SUM(balance) OVER (
            PARTITION BY people_branches_id 
            ORDER BY invoice_date ASC, created_at ASC
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ) as calculated_arrears
    FROM public.franchisee_invoices
    WHERE status != 'cancelled'
)
UPDATE public.franchisee_invoices fi
SET previous_balance = COALESCE(ac.calculated_arrears, 0)
FROM arrears_calc ac
WHERE fi.id = ac.id;
