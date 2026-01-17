CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id uuid)
 RETURNS TABLE(role_name text, role_level integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT r.name, r.level
    FROM app_users au
    JOIN user_roles ur ON au.id = ur.app_user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE au.user_id = p_user_id
    AND ur.is_active = TRUE
    AND r.is_active = TRUE
    ORDER BY r.level ASC;
END;
$function$
