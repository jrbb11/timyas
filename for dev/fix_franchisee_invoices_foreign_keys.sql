-- Fix foreign key constraints for franchisee_invoices
-- The created_by and approved_by should reference app_users, not people

-- Drop old wrong constraints
ALTER TABLE franchisee_invoices 
DROP CONSTRAINT IF EXISTS franchisee_invoices_created_by_fkey;

ALTER TABLE franchisee_invoices 
DROP CONSTRAINT IF EXISTS franchisee_invoices_approved_by_fkey;

-- Create correct constraints pointing to app_users
ALTER TABLE franchisee_invoices 
ADD CONSTRAINT franchisee_invoices_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES app_users(id) ON DELETE SET NULL;

ALTER TABLE franchisee_invoices 
ADD CONSTRAINT franchisee_invoices_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES app_users(id) ON DELETE SET NULL;

-- Verify the fix
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'franchisee_invoices' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND (tc.constraint_name LIKE '%created_by%' OR tc.constraint_name LIKE '%approved_by%');
