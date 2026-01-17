CREATE OR REPLACE FUNCTION public.resolve_security_event(p_event_id uuid, p_resolved_by uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.security_events 
    SET resolved = TRUE, resolved_by = p_resolved_by, resolved_at = NOW()
    WHERE id = p_event_id;
    
    RETURN FOUND;
END;
$function$
