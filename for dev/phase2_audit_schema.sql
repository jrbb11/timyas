-- =====================================================
-- TIMYAS ERP - PHASE 2: ENHANCED AUDIT LOGGING SYSTEM
-- =====================================================
-- Comprehensive audit logging and security monitoring
-- This extends the existing RBAC system with detailed audit trails
-- =====================================================

-- =====================================================
-- 1. AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_email TEXT,
    user_role TEXT,
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT'
    resource TEXT NOT NULL, -- 'products', 'sales', 'purchases', 'users', etc.
    resource_id UUID, -- ID of the affected record
    resource_name TEXT, -- Human-readable name of the resource
    old_values JSONB, -- Previous values (for updates)
    new_values JSONB, -- New values (for creates/updates)
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity TEXT DEFAULT 'INFO', -- 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
    category TEXT NOT NULL, -- 'DATA_CHANGE', 'AUTHENTICATION', 'AUTHORIZATION', 'SYSTEM'
    description TEXT,
    metadata JSONB, -- Additional context data
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
    CONSTRAINT audit_logs_user_fkey FOREIGN KEY (user_id) REFERENCES app_users (user_id) ON DELETE SET NULL,
    CONSTRAINT audit_logs_action_check CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT')),
    CONSTRAINT audit_logs_severity_check CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    CONSTRAINT audit_logs_category_check CHECK (category IN ('DATA_CHANGE', 'AUTHENTICATION', 'AUTHORIZATION', 'SYSTEM', 'SECURITY', 'COMPLIANCE'))
);

-- =====================================================
-- 2. SECURITY EVENTS TABLE
-- =====================================================
CREATE TABLE public.security_events (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- 'FAILED_LOGIN', 'PERMISSION_DENIED', 'SUSPICIOUS_ACTIVITY', 'DATA_BREACH_ATTEMPT'
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    severity TEXT DEFAULT 'WARNING',
    description TEXT,
    metadata JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT security_events_pkey PRIMARY KEY (id),
    CONSTRAINT security_events_user_fkey FOREIGN KEY (user_id) REFERENCES app_users (user_id) ON DELETE SET NULL,
    CONSTRAINT security_events_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES app_users (user_id) ON DELETE SET NULL
);

-- =====================================================
-- 3. AUDIT LOG FUNCTIONS
-- =====================================================

-- Main function for logging audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_user_id UUID,
    p_action TEXT,
    p_resource TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_resource_name TEXT DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'INFO',
    p_category TEXT DEFAULT 'DATA_CHANGE',
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_user_email TEXT;
    v_user_role TEXT;
BEGIN
    -- Get user email and role
    SELECT au.email, r.name INTO v_user_email, v_user_role
    FROM auth.users au
    LEFT JOIN public.user_roles ur ON au.id = ur.app_user_id
    LEFT JOIN public.roles r ON ur.role_id = r.id
    WHERE au.id = p_user_id;
    
    -- Insert audit log
    INSERT INTO public.audit_logs (
        user_id, user_email, user_role, action, resource, resource_id, resource_name,
        old_values, new_values, ip_address, user_agent, session_id,
        severity, category, description, metadata
    ) VALUES (
        p_user_id, v_user_email, v_user_role, p_action, p_resource, p_resource_id, p_resource_name,
        p_old_values, p_new_values, p_ip_address, p_user_agent, p_session_id,
        p_severity, p_category, p_description, p_metadata
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for logging data changes
CREATE OR REPLACE FUNCTION public.log_data_change(
    p_user_id UUID,
    p_action TEXT,
    p_resource TEXT,
    p_resource_id UUID,
    p_resource_name TEXT,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
BEGIN
    RETURN public.log_audit_event(
        p_user_id, p_action, p_resource, p_resource_id, p_resource_name,
        p_old_values, p_new_values, p_ip_address, p_user_agent,
        NULL, 'INFO', 'DATA_CHANGE', 
        p_action || ' ' || p_resource || ' ' || COALESCE(p_resource_name, p_resource_id::TEXT)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for logging security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type TEXT,
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'WARNING',
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.security_events (
        event_type, user_id, ip_address, user_agent, severity, description, metadata
    ) VALUES (
        p_event_type, p_user_id, p_ip_address, p_user_agent, p_severity, p_description, p_metadata
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for logging user actions
CREATE OR REPLACE FUNCTION public.log_user_action(
    p_user_id UUID,
    p_action TEXT,
    p_resource TEXT,
    p_description TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
BEGIN
    RETURN public.log_audit_event(
        p_user_id, p_action, p_resource, NULL, NULL,
        NULL, NULL, p_ip_address, p_user_agent,
        NULL, 'INFO', 'AUTHORIZATION', p_description
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. AUDIT TRIGGER FUNCTIONS
-- =====================================================

-- Generic trigger function for audit logging
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_action TEXT;
    v_resource_name TEXT;
    v_old_values JSONB;
    v_new_values JSONB;
BEGIN
    -- Get current user ID from context
    v_user_id := COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID);
    
    -- Determine action and values
    IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE';
        v_new_values := to_jsonb(NEW);
        -- Handle different table structures for resource name
        v_resource_name := COALESCE(
            CASE WHEN TG_TABLE_NAME = 'user_roles' THEN 
                (SELECT r.name FROM roles r WHERE r.id = NEW.role_id) || ' role assigned'
            ELSE
                COALESCE(NEW.name, NEW.title, NEW.code, NEW.id::TEXT)
            END
        );
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        -- Handle different table structures for resource name
        v_resource_name := COALESCE(
            CASE WHEN TG_TABLE_NAME = 'user_roles' THEN 
                (SELECT r.name FROM roles r WHERE r.id = NEW.role_id) || ' role updated'
            ELSE
                COALESCE(NEW.name, NEW.title, NEW.code, NEW.id::TEXT)
            END
        );
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old_values := to_jsonb(OLD);
        -- Handle different table structures for resource name
        v_resource_name := COALESCE(
            CASE WHEN TG_TABLE_NAME = 'user_roles' THEN 
                (SELECT r.name FROM roles r WHERE r.id = OLD.role_id) || ' role removed'
            ELSE
                COALESCE(OLD.name, OLD.title, OLD.code, OLD.id::TEXT)
            END
        );
    END IF;
    
    -- Log the audit event
    PERFORM public.log_data_change(
        v_user_id,
        v_action,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        v_resource_name,
        v_old_values,
        v_new_values
    );
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. AUDIT TRIGGERS FOR CRITICAL TABLES
-- =====================================================

-- Products table audit trigger
CREATE TRIGGER products_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Sales table audit trigger
CREATE TRIGGER sales_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Purchases table audit trigger
CREATE TRIGGER purchases_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- People table audit trigger (customers table doesn't exist)
CREATE TRIGGER people_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.people
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- User roles table audit trigger
CREATE TRIGGER user_roles_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Deposits table audit trigger
CREATE TRIGGER deposits_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.deposits
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Expenses table audit trigger
CREATE TRIGGER expenses_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Transfers table audit trigger
CREATE TRIGGER transfers_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.transfers
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- =====================================================
-- 6. AUDIT QUERY FUNCTIONS
-- =====================================================

-- Function to get audit trail for a specific resource
CREATE OR REPLACE FUNCTION public.get_audit_trail(
    p_resource TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_action TEXT DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    user_email TEXT,
    user_role TEXT,
    action TEXT,
    resource TEXT,
    resource_id UUID,
    resource_name TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    log_timestamp TIMESTAMP WITH TIME ZONE,
    severity TEXT,
    category TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id, al.user_email, al.user_role, al.action, al.resource, al.resource_id, al.resource_name,
        al.old_values, al.new_values, al.ip_address, al.user_agent, al.timestamp AS log_timestamp,
        al.severity, al.category, al.description
    FROM public.audit_logs al
    WHERE 
        (p_resource IS NULL OR al.resource = p_resource)
        AND (p_resource_id IS NULL OR al.resource_id = p_resource_id)
        AND (p_user_id IS NULL OR al.user_id = p_user_id)
        AND (p_action IS NULL OR al.action = p_action)
        AND (p_start_date IS NULL OR al.timestamp >= p_start_date)
        AND (p_end_date IS NULL OR al.timestamp <= p_end_date)
    ORDER BY al.timestamp DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get security events
CREATE OR REPLACE FUNCTION public.get_security_events(
    p_event_type TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT NULL,
    p_resolved BOOLEAN DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    event_type TEXT,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    severity TEXT,
    description TEXT,
    metadata JSONB,
    resolved BOOLEAN,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        se.id, se.event_type, se.user_id, se.ip_address, se.user_agent, se.severity,
        se.description, se.metadata, se.resolved, se.resolved_by, se.resolved_at, se.created_at
    FROM public.security_events se
    WHERE 
        (p_event_type IS NULL OR se.event_type = p_event_type)
        AND (p_severity IS NULL OR se.severity = p_severity)
        AND (p_resolved IS NULL OR se.resolved = p_resolved)
        AND (p_start_date IS NULL OR se.created_at >= p_start_date)
        AND (p_end_date IS NULL OR se.created_at <= p_end_date)
    ORDER BY se.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs (resource);
CREATE INDEX idx_audit_logs_resource_id ON public.audit_logs (resource_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs (timestamp);
CREATE INDEX idx_audit_logs_severity ON public.audit_logs (severity);
CREATE INDEX idx_audit_logs_category ON public.audit_logs (category);

-- Security events indexes
CREATE INDEX idx_security_events_event_type ON public.security_events (event_type);
CREATE INDEX idx_security_events_severity ON public.security_events (severity);
CREATE INDEX idx_security_events_resolved ON public.security_events (resolved);
CREATE INDEX idx_security_events_created_at ON public.security_events (created_at);

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on audit tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Audit logs RLS policy - only users with audit permission can view
CREATE POLICY audit_logs_view_policy ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.role_permissions rp ON ur.role_id = rp.role_id
            JOIN public.permissions p ON rp.permission_id = p.id
            WHERE ur.app_user_id = auth.uid()
            AND p.resource = 'audit'
            AND p.action = 'read'
        )
    );

-- Security events RLS policy - only users with security permission can view
CREATE POLICY security_events_view_policy ON public.security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.role_permissions rp ON ur.role_id = rp.role_id
            JOIN public.permissions p ON rp.permission_id = p.id
            WHERE ur.app_user_id = auth.uid()
            AND p.resource = 'security'
            AND p.action = 'read'
        )
    );

-- =====================================================
-- 9. AUDIT SYSTEM INITIALIZATION
-- =====================================================

-- Log the creation of the audit system
-- Use the first available user ID or NULL if no users exist
INSERT INTO public.audit_logs (
    user_id, user_email, user_role, action, resource, resource_name,
    severity, category, description
) VALUES (
    (SELECT user_id FROM app_users LIMIT 1),
    'system@timyas.com',
    'System',
    'CREATE',
    'audit_system',
    'Enhanced Audit Logging System',
    'INFO',
    'SYSTEM',
    'Audit logging system initialized successfully'
);

-- =====================================================
-- AUDIT SYSTEM CREATION COMPLETE
-- =====================================================
