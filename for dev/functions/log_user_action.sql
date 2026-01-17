CREATE OR REPLACE FUNCTION public.log_user_action(p_user_id uuid, p_action text, p_resource text, p_description text DEFAULT NULL::text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN public.log_audit_event(
        p_user_id, p_action, p_resource, NULL, NULL,
        NULL, NULL, p_ip_address, p_user_agent,
        NULL, 'INFO', 'AUTHORIZATION', p_description
    );
END;
$function$
