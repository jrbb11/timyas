CREATE OR REPLACE FUNCTION public.log_data_change(p_user_id uuid, p_action text, p_resource text, p_resource_id uuid, p_resource_name text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN public.log_audit_event(
        p_user_id, p_action, p_resource, p_resource_id, p_resource_name,
        p_old_values, p_new_values, p_ip_address, p_user_agent,
        NULL, 'INFO', 'DATA_CHANGE', 
        p_action || ' ' || p_resource || ' ' || COALESCE(p_resource_name, p_resource_id::TEXT)
    );
END;
$function$
