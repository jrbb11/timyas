CREATE OR REPLACE FUNCTION public.set_current_user_id(user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Set the current user ID in the session
    PERFORM set_config('app.current_user_id', user_id::TEXT, true);
END;
$function$
