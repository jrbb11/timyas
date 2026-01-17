CREATE OR REPLACE FUNCTION public.log_audit_event(p_user_id uuid, p_action text, p_resource text, p_resource_id uuid DEFAULT NULL::uuid, p_resource_name text DEFAULT NULL::text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_session_id text DEFAULT NULL::text, p_severity text DEFAULT 'INFO'::text, p_category text DEFAULT 'DATA_CHANGE'::text, p_description text DEFAULT NULL::text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
