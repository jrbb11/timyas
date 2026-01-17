CREATE OR REPLACE FUNCTION public.delete_purchase_with_user_context(p_purchase_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Set the current user ID in the session for the audit trigger
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);

    -- Perform the delete operation
    DELETE FROM public.purchases WHERE id = p_purchase_id;
    
    -- Return true if deletion was successful
    RETURN FOUND;
END;
$function$
