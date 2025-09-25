-- =====================================================
-- RBAC SCHEMA FIX - Add 'adjust' to permissions constraint
-- =====================================================

-- Drop the existing constraint
ALTER TABLE public.permissions DROP CONSTRAINT IF EXISTS permissions_action_check;

-- Add the updated constraint with 'adjust' and 'audit' included
ALTER TABLE public.permissions 
ADD CONSTRAINT permissions_action_check 
CHECK (action IN ('create', 'read', 'update', 'delete', 'approve', 'export', 'manage', 'adjust', 'audit'));
