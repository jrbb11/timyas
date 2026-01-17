CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid)
 RETURNS TABLE(resource text, action text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT p.resource, p.action
    FROM app_users au
    JOIN user_roles ur ON au.id = ur.app_user_id
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE au.user_id = p_user_id
    AND ur.is_active = TRUE
    AND r.is_active = TRUE
    AND p.is_active = TRUE
    ORDER BY p.resource, p.action;
END;
$function$
