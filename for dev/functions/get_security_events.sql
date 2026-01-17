CREATE OR REPLACE FUNCTION public.get_security_events(p_event_type text DEFAULT NULL::text, p_severity text DEFAULT NULL::text, p_resolved boolean DEFAULT NULL::boolean, p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, event_type text, user_id uuid, ip_address inet, user_agent text, severity text, description text, metadata jsonb, resolved boolean, resolved_by uuid, resolved_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
