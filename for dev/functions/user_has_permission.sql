CREATE OR REPLACE FUNCTION public.user_has_permission(p_user_id uuid, p_resource text, p_action text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM app_users au
        JOIN user_roles ur ON au.id = ur.app_user_id
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE au.user_id = p_user_id
        AND ur.is_active = TRUE
        AND r.is_active = TRUE
        AND p.is_active = TRUE
        AND p.resource = p_resource
        AND p.action = p_action
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$function$
