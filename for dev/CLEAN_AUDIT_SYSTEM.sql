-- =====================================================
-- CLEAN AUDIT SYSTEM - FINAL INSTALLATION
-- =====================================================
-- This is the FINAL, CLEAN audit system installation script
-- Run this to ensure your audit system is properly installed
-- =====================================================

-- =====================================================
-- 1. DROP EXISTING AUDIT SYSTEM (CLEAN SLATE)
-- =====================================================

-- Drop all audit triggers
DROP TRIGGER IF EXISTS products_audit_trigger ON public.products;
DROP TRIGGER IF EXISTS people_audit_trigger ON public.people;
DROP TRIGGER IF EXISTS purchases_audit_trigger ON public.purchases;
DROP TRIGGER IF EXISTS sales_audit_trigger ON public.sales;
DROP TRIGGER IF EXISTS user_roles_audit_trigger ON public.user_roles;
DROP TRIGGER IF EXISTS deposits_audit_trigger ON public.deposits;
DROP TRIGGER IF EXISTS expenses_audit_trigger ON public.expenses;
DROP TRIGGER IF EXISTS transfers_audit_trigger ON public.transfers;

-- Drop all user context functions
DROP FUNCTION IF EXISTS public.create_product_with_user_context(UUID, JSONB);
DROP FUNCTION IF EXISTS public.update_product_with_user_context(UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS public.delete_product_with_user_context(UUID, UUID);
DROP FUNCTION IF EXISTS public.create_customer_with_user_context(UUID, JSONB);
DROP FUNCTION IF EXISTS public.update_customer_with_user_context(UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS public.delete_customer_with_user_context(UUID, UUID);
DROP FUNCTION IF EXISTS public.create_purchase_with_user_context(UUID, JSONB);
DROP FUNCTION IF EXISTS public.update_purchase_with_user_context(UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS public.delete_purchase_with_user_context(UUID, UUID);
DROP FUNCTION IF EXISTS public.create_sale_with_user_context(UUID, JSONB);
DROP FUNCTION IF EXISTS public.update_sale_with_user_context(UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS public.delete_sale_with_user_context(UUID, UUID);

-- Drop audit system functions
DROP FUNCTION IF EXISTS public.set_current_user_id(UUID);
DROP FUNCTION IF EXISTS public.audit_trigger_function();
DROP FUNCTION IF EXISTS public.log_audit_event(UUID, TEXT, TEXT, UUID, TEXT, JSONB, JSONB, INET, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.log_data_change(UUID, TEXT, TEXT, UUID, TEXT, JSONB, JSONB, INET, TEXT);
DROP FUNCTION IF EXISTS public.log_security_event(TEXT, UUID, INET, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.log_user_action(UUID, TEXT, TEXT, TEXT, INET, TEXT);
DROP FUNCTION IF EXISTS public.get_audit_trail(TEXT, UUID, UUID, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER, INTEGER);

-- Drop audit tables
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.security_events CASCADE;

-- =====================================================
-- 2. CREATE AUDIT TABLES
-- =====================================================

-- Audit logs table
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_email TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id UUID,
    resource_name TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity TEXT DEFAULT 'INFO',
    category TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
    CONSTRAINT audit_logs_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE SET NULL,
    CONSTRAINT audit_logs_action_check CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT')),
    CONSTRAINT audit_logs_severity_check CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    CONSTRAINT audit_logs_category_check CHECK (category IN ('DATA_CHANGE', 'AUTHENTICATION', 'AUTHORIZATION', 'SYSTEM', 'SECURITY', 'COMPLIANCE'))
);

-- Security events table
CREATE TABLE public.security_events (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
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
    CONSTRAINT security_events_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE SET NULL,
    CONSTRAINT security_events_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users (id) ON DELETE SET NULL
);

-- =====================================================
-- 3. CREATE AUDIT SYSTEM FUNCTIONS
-- =====================================================

-- Set current user ID function
CREATE OR REPLACE FUNCTION public.set_current_user_id(user_id UUID)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_action TEXT;
    v_old_values JSONB;
    v_new_values JSONB;
BEGIN
    -- Get the current user ID, use a valid user if none found
    v_user_id := COALESCE(
        current_setting('app.current_user_id', true)::UUID, 
        (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
    );
    
    -- Get user email
    BEGIN
        SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    EXCEPTION
        WHEN OTHERS THEN
            v_user_email := 'system@timyas.com';
    END;
    
    IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE';
        v_old_values := NULL;
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
    END IF;
    
    INSERT INTO public.audit_logs (
        user_id, user_email, action, resource, resource_id, resource_name, old_values, new_values, severity, category, description
    ) VALUES (
        v_user_id, v_user_email, v_action, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), TG_TABLE_NAME || ' ' || COALESCE(NEW.id, OLD.id)::TEXT, v_old_values, v_new_values, 'INFO', 'DATA_CHANGE', v_action || ' operation on ' || TG_TABLE_NAME
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get audit trail function
CREATE OR REPLACE FUNCTION public.get_audit_trail(
    p_resource TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_action TEXT DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
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
        al.id,
        al.user_email,
        al.user_role,
        al.action,
        al.resource,
        al.resource_id,
        al.resource_name,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.timestamp,
        al.severity,
        al.category,
        al.description
    FROM public.audit_logs al
    WHERE 
        (p_resource IS NULL OR al.resource = p_resource)
        AND (p_resource_id IS NULL OR al.resource_id = p_resource_id)
        AND (p_user_id IS NULL OR al.user_id = p_user_id)
        AND (p_action IS NULL OR al.action = p_action)
        AND (p_start_date IS NULL OR al.timestamp >= p_start_date)
        AND (p_end_date IS NULL OR al.timestamp <= p_end_date)
    ORDER BY al.timestamp DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. CREATE USER CONTEXT FUNCTIONS
-- =====================================================

-- Product functions
CREATE OR REPLACE FUNCTION public.create_product_with_user_context(p_user_id UUID, p_data JSONB)
RETURNS SETOF public.products AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
    RETURN QUERY
    INSERT INTO public.products (name, code, brand, barcode_symbology, category, order_tax, tax_type, description, type, product_cost, product_price, product_unit, sale_unit, purchase_unit, stock_alert, has_serial, not_for_selling, image_urls)
    VALUES ((p_data->>'name')::TEXT, (p_data->>'code')::TEXT, (p_data->>'brand')::UUID, COALESCE((p_data->>'barcode_symbology')::TEXT, 'Code 128'), (p_data->>'category')::UUID, COALESCE((p_data->>'order_tax')::NUMERIC, 0), COALESCE((p_data->>'tax_type')::TEXT, 'Exclusive'), (p_data->>'description')::TEXT, COALESCE((p_data->>'type')::TEXT, 'Standard Product'), (p_data->>'product_cost')::NUMERIC, (p_data->>'product_price')::NUMERIC, (p_data->>'product_unit')::UUID, (p_data->>'sale_unit')::UUID, (p_data->>'purchase_unit')::UUID, COALESCE((p_data->>'stock_alert')::INTEGER, 0), COALESCE((p_data->>'has_serial')::BOOLEAN, FALSE), COALESCE((p_data->>'not_for_selling')::BOOLEAN, FALSE), (p_data->>'image_urls')::TEXT[])
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_product_with_user_context(p_product_id UUID, p_user_id UUID, p_data JSONB)
RETURNS SETOF public.products AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
    RETURN QUERY
    UPDATE public.products SET name = COALESCE(p_data->>'name', name)::TEXT, code = COALESCE(p_data->>'code', code)::TEXT, brand = COALESCE((p_data->>'brand')::UUID, brand), barcode_symbology = COALESCE(p_data->>'barcode_symbology', barcode_symbology)::TEXT, category = COALESCE((p_data->>'category')::UUID, category), order_tax = COALESCE((p_data->>'order_tax')::NUMERIC, order_tax), tax_type = COALESCE(p_data->>'tax_type', tax_type)::TEXT, description = COALESCE(p_data->>'description', description)::TEXT, type = COALESCE(p_data->>'type', type)::TEXT, product_cost = COALESCE((p_data->>'product_cost')::NUMERIC, product_cost), product_price = COALESCE((p_data->>'product_price')::NUMERIC, product_price), product_unit = COALESCE((p_data->>'product_unit')::UUID, product_unit), sale_unit = COALESCE((p_data->>'sale_unit')::UUID, sale_unit), purchase_unit = COALESCE((p_data->>'purchase_unit')::UUID, purchase_unit), stock_alert = COALESCE((p_data->>'stock_alert')::INTEGER, stock_alert), has_serial = COALESCE((p_data->>'has_serial')::BOOLEAN, has_serial), not_for_selling = COALESCE((p_data->>'not_for_selling')::BOOLEAN, not_for_selling), image_urls = COALESCE((p_data->>'image_urls')::TEXT[], image_urls)
    WHERE id = p_product_id RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.delete_product_with_user_context(p_product_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
    DELETE FROM public.products WHERE id = p_product_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Customer functions
CREATE OR REPLACE FUNCTION public.create_customer_with_user_context(p_user_id UUID, p_data JSONB)
RETURNS SETOF public.people AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
    RETURN QUERY
    INSERT INTO public.people (type, name, company, email, phone, address, city, country, is_active, note, user_id)
    VALUES ('customer'::TEXT, (p_data->>'name')::TEXT, (p_data->>'company')::TEXT, (p_data->>'email')::TEXT, (p_data->>'phone')::TEXT, (p_data->>'address')::TEXT, (p_data->>'city')::TEXT, (p_data->>'country')::TEXT, COALESCE((p_data->>'is_active')::BOOLEAN, TRUE), (p_data->>'note')::TEXT, p_user_id)
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_customer_with_user_context(p_customer_id UUID, p_user_id UUID, p_data JSONB)
RETURNS SETOF public.people AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
    RETURN QUERY
    UPDATE public.people SET name = COALESCE(p_data->>'name', name)::TEXT, company = COALESCE(p_data->>'company', company)::TEXT, email = COALESCE(p_data->>'email', email)::TEXT, phone = COALESCE(p_data->>'phone', phone)::TEXT, address = COALESCE(p_data->>'address', address)::TEXT, city = COALESCE(p_data->>'city', city)::TEXT, country = COALESCE(p_data->>'country', country)::TEXT, is_active = COALESCE((p_data->>'is_active')::BOOLEAN, is_active), note = COALESCE(p_data->>'note', note)::TEXT
    WHERE id = p_customer_id RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.delete_customer_with_user_context(p_customer_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
    DELETE FROM public.people WHERE id = p_customer_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Purchase functions
CREATE OR REPLACE FUNCTION public.create_purchase_with_user_context(p_user_id UUID, p_data JSONB)
RETURNS SETOF public.purchases AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
    RETURN QUERY
    INSERT INTO public.purchases (date, supplier, warehouse, order_tax, discount, shipping, status, note, total_amount, reference, payment_status)
    VALUES ((p_data->>'date')::DATE, (p_data->>'supplier')::UUID, (p_data->>'warehouse')::UUID, COALESCE((p_data->>'order_tax')::NUMERIC, 0), COALESCE((p_data->>'discount')::NUMERIC, 0), COALESCE((p_data->>'shipping')::NUMERIC, 0), COALESCE((p_data->>'status')::TEXT, 'received'), (p_data->>'note')::TEXT, (p_data->>'total_amount')::NUMERIC, (p_data->>'reference')::TEXT, COALESCE((p_data->>'payment_status')::TEXT, 'pending'))
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_purchase_with_user_context(p_purchase_id UUID, p_user_id UUID, p_data JSONB)
RETURNS SETOF public.purchases AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
    RETURN QUERY
    UPDATE public.purchases SET date = COALESCE((p_data->>'date')::DATE, date), supplier = COALESCE((p_data->>'supplier')::UUID, supplier), warehouse = COALESCE((p_data->>'warehouse')::UUID, warehouse), order_tax = COALESCE((p_data->>'order_tax')::NUMERIC, order_tax), discount = COALESCE((p_data->>'discount')::NUMERIC, discount), shipping = COALESCE((p_data->>'shipping')::NUMERIC, shipping), status = COALESCE(p_data->>'status', status)::TEXT, note = COALESCE(p_data->>'note', note)::TEXT, total_amount = COALESCE((p_data->>'total_amount')::NUMERIC, total_amount), reference = COALESCE(p_data->>'reference', reference)::TEXT, payment_status = COALESCE(p_data->>'payment_status', payment_status)::TEXT
    WHERE id = p_purchase_id RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.delete_purchase_with_user_context(p_purchase_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
    DELETE FROM public.purchases WHERE id = p_purchase_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sale functions
CREATE OR REPLACE FUNCTION public.create_sale_with_user_context(p_user_id UUID, p_data JSONB)
RETURNS SETOF public.sales AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
    RETURN QUERY
    INSERT INTO public.sales (reference, invoice_number, date, warehouse, order_tax, discount, shipping, status, payment_status, note, total_amount, is_return, original_sale_id, people_branches_id)
    VALUES ((p_data->>'reference')::TEXT, (p_data->>'invoice_number')::TEXT, (p_data->>'date')::DATE, (p_data->>'warehouse')::UUID, COALESCE((p_data->>'order_tax')::NUMERIC, 0), COALESCE((p_data->>'discount')::NUMERIC, 0), COALESCE((p_data->>'shipping')::NUMERIC, 0), (p_data->>'status')::TEXT, (p_data->>'payment_status')::TEXT, (p_data->>'note')::TEXT, (p_data->>'total_amount')::NUMERIC, COALESCE((p_data->>'is_return')::BOOLEAN, FALSE), (p_data->>'original_sale_id')::UUID, (p_data->>'people_branches_id')::UUID)
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_sale_with_user_context(p_sale_id UUID, p_user_id UUID, p_data JSONB)
RETURNS SETOF public.sales AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
    RETURN QUERY
    UPDATE public.sales SET reference = COALESCE(p_data->>'reference', reference)::TEXT, invoice_number = COALESCE(p_data->>'invoice_number', invoice_number)::TEXT, date = COALESCE((p_data->>'date')::DATE, date), warehouse = COALESCE((p_data->>'warehouse')::UUID, warehouse), order_tax = COALESCE((p_data->>'order_tax')::NUMERIC, order_tax), discount = COALESCE((p_data->>'discount')::NUMERIC, discount), shipping = COALESCE((p_data->>'shipping')::NUMERIC, shipping), status = COALESCE(p_data->>'status', status)::TEXT, payment_status = COALESCE(p_data->>'payment_status', payment_status)::TEXT, note = COALESCE(p_data->>'note', note)::TEXT, total_amount = COALESCE((p_data->>'total_amount')::NUMERIC, total_amount), is_return = COALESCE((p_data->>'is_return')::BOOLEAN, is_return), original_sale_id = COALESCE((p_data->>'original_sale_id')::UUID, original_sale_id), people_branches_id = COALESCE((p_data->>'people_branches_id')::UUID, people_branches_id)
    WHERE id = p_sale_id RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.delete_sale_with_user_context(p_sale_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
    DELETE FROM public.sales WHERE id = p_sale_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE AUDIT TRIGGERS
-- =====================================================

CREATE TRIGGER products_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER people_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.people
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER purchases_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.purchases
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER sales_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_trigger_function();

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.set_current_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_audit_trail(TEXT, UUID, UUID, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_product_with_user_context(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_product_with_user_context(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_product_with_user_context(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_with_user_context(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_customer_with_user_context(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_customer_with_user_context(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_purchase_with_user_context(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_purchase_with_user_context(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_purchase_with_user_context(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_sale_with_user_context(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_sale_with_user_context(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_sale_with_user_context(UUID, UUID) TO authenticated;

-- =====================================================
-- 7. VERIFICATION
-- =====================================================

SELECT 'AUDIT SYSTEM INSTALLATION COMPLETE' as info,
       'All functions created' as functions,
       'All triggers active' as triggers,
       'All permissions granted' as permissions,
       'Ready for production use' as status;
