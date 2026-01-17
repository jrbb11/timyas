CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type text, p_user_id uuid DEFAULT NULL::uuid, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_severity text DEFAULT 'WARNING'::text, p_description text DEFAULT NULL::text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
