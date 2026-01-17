CREATE OR REPLACE FUNCTION public.get_audit_trail(p_resource text DEFAULT NULL::text, p_resource_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT NULL::uuid, p_action text DEFAULT NULL::text, p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, user_email text, user_role text, action text, resource text, resource_id uuid, resource_name text, old_values jsonb, new_values jsonb, ip_address inet, user_agent text, log_timestamp timestamp with time zone, severity text, category text, description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
