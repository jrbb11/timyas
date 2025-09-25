-- =====================================================
-- TIMYAS ERP - ENHANCED RBAC SYSTEM (PHASE 1)
-- =====================================================
-- Enhanced Role-Based Access Control System
-- This extends the existing user system with granular permissions
-- =====================================================

-- =====================================================
-- 1. ROLES TABLE
-- =====================================================
CREATE TABLE public.roles (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    level INTEGER NOT NULL, -- 1=Owner, 2=Admin, 3=Manager, 4=Staff
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT roles_pkey PRIMARY KEY (id),
    CONSTRAINT roles_level_check CHECK (level >= 1 AND level <= 4)
);

-- =====================================================
-- 2. PERMISSIONS TABLE
-- =====================================================
CREATE TABLE public.permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    resource TEXT NOT NULL, -- 'products', 'sales', 'purchases', 'users', etc.
    action TEXT NOT NULL,    -- 'create', 'read', 'update', 'delete', 'approve', 'export'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT permissions_pkey PRIMARY KEY (id),
    CONSTRAINT permissions_unique UNIQUE (resource, action),
    CONSTRAINT permissions_action_check CHECK (action IN ('create', 'read', 'update', 'delete', 'approve', 'export', 'manage', 'adjust', 'audit'))
);

-- =====================================================
-- 3. ROLE-PERMISSION MAPPING TABLE
-- =====================================================
CREATE TABLE public.role_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
    CONSTRAINT role_permissions_unique UNIQUE (role_id, permission_id),
    CONSTRAINT role_permissions_role_fkey FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT role_permissions_permission_fkey FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
);

-- =====================================================
-- 4. ENHANCED USER ROLES TABLE (extends existing)
-- =====================================================
-- We'll modify the existing user_roles table to reference our new roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles (id),
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES app_users (id),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS roles_level_idx ON public.roles USING btree (level);
CREATE INDEX IF NOT EXISTS roles_name_idx ON public.roles USING btree (name);
CREATE INDEX IF NOT EXISTS permissions_resource_idx ON public.permissions USING btree (resource);
CREATE INDEX IF NOT EXISTS permissions_action_idx ON public.permissions USING btree (action);
CREATE INDEX IF NOT EXISTS role_permissions_role_idx ON public.role_permissions USING btree (role_id);
CREATE INDEX IF NOT EXISTS role_permissions_permission_idx ON public.role_permissions USING btree (permission_id);
CREATE INDEX IF NOT EXISTS user_roles_role_id_idx ON public.user_roles USING btree (role_id);
CREATE INDEX IF NOT EXISTS user_roles_app_user_active_idx ON public.user_roles USING btree (app_user_id, is_active);

-- =====================================================
-- 6. TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER roles_updated_at_trigger
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION updated_at_timestamp();

CREATE TRIGGER permissions_updated_at_trigger
    BEFORE UPDATE ON public.permissions
    FOR EACH ROW
    EXECUTE FUNCTION updated_at_timestamp();

-- =====================================================
-- 7. UTILITY FUNCTIONS
-- =====================================================

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_resource TEXT,
    p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM app_users au
        JOIN user_roles ur ON au.id = ur.app_user_id
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE au.user_id = p_user_id
        AND ur.is_active = TRUE
        AND r.is_active = TRUE
        AND p.is_active = TRUE
        AND p.resource = p_resource
        AND p.action = p_action
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TABLE(role_name TEXT, role_level INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name, r.level
    FROM app_users au
    JOIN user_roles ur ON au.id = ur.app_user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE au.user_id = p_user_id
    AND ur.is_active = TRUE
    AND r.is_active = TRUE
    ORDER BY r.level ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(resource TEXT, action TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.resource, p.action
    FROM app_users au
    JOIN user_roles ur ON au.id = ur.app_user_id
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE au.user_id = p_user_id
    AND ur.is_active = TRUE
    AND r.is_active = TRUE
    AND p.is_active = TRUE
    ORDER BY p.resource, p.action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. INITIAL DATA - ROLES
-- =====================================================
INSERT INTO public.roles (name, level, description) VALUES
('Owner', 1, 'Full system access, user management, financial reports, system settings'),
('Admin', 2, 'All operations except user management, limited financial access'),
('Manager', 3, 'Sales/Purchase management, inventory, reports (read-only financial)'),
('Staff', 4, 'Basic operations, limited to assigned branches')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 9. INITIAL DATA - PERMISSIONS
-- =====================================================
INSERT INTO public.permissions (resource, action, description) VALUES
-- User Management
('users', 'create', 'Create new users'),
('users', 'read', 'View user information'),
('users', 'update', 'Update user information'),
('users', 'delete', 'Delete users'),
('users', 'manage', 'Manage user roles and permissions'),

-- Products
('products', 'create', 'Create new products'),
('products', 'read', 'View products'),
('products', 'update', 'Update product information'),
('products', 'delete', 'Delete products'),

-- Sales
('sales', 'create', 'Create new sales'),
('sales', 'read', 'View sales'),
('sales', 'update', 'Update sales'),
('sales', 'delete', 'Delete sales'),
('sales', 'approve', 'Approve sales'),

-- Purchases
('purchases', 'create', 'Create new purchases'),
('purchases', 'read', 'View purchases'),
('purchases', 'update', 'Update purchases'),
('purchases', 'delete', 'Delete purchases'),
('purchases', 'approve', 'Approve purchases'),

-- Inventory
('inventory', 'read', 'View inventory'),
('inventory', 'update', 'Update inventory'),
('inventory', 'adjust', 'Adjust inventory'),

-- Reports
('reports', 'read', 'View reports'),
('reports', 'export', 'Export reports'),

-- Financial
('financial', 'read', 'View financial data'),
('financial', 'manage', 'Manage financial settings'),

-- System
('system', 'manage', 'Manage system settings'),
('system', 'audit', 'View audit logs')
ON CONFLICT (resource, action) DO NOTHING;

-- =====================================================
-- 10. ROLE-PERMISSION MAPPINGS
-- =====================================================

-- Owner: All permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Owner'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin: All except user management and system management
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Admin'
AND NOT (p.resource = 'users' AND p.action = 'manage')
AND NOT (p.resource = 'system' AND p.action = 'manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager: Sales, Purchases, Inventory, Reports (read-only financial)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Manager'
AND (
    p.resource IN ('products', 'sales', 'purchases', 'inventory', 'reports')
    OR (p.resource = 'financial' AND p.action = 'read')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Staff: Basic operations
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Staff'
AND (
    (p.resource = 'products' AND p.action IN ('read', 'create', 'update'))
    OR (p.resource = 'sales' AND p.action IN ('read', 'create'))
    OR (p.resource = 'purchases' AND p.action IN ('read', 'create'))
    OR (p.resource = 'inventory' AND p.action = 'read')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- 11. MIGRATE EXISTING USER ROLES
-- =====================================================
-- Update existing user_roles to use new role system
UPDATE public.user_roles 
SET role_id = (
    SELECT r.id 
    FROM roles r 
    WHERE r.name = user_roles.role
),
assigned_at = NOW(),
is_active = TRUE
WHERE role_id IS NULL;

-- =====================================================
-- 12. GRANT PERMISSIONS
-- =====================================================
-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION user_has_permission(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;
