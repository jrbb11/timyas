CREATE OR REPLACE FUNCTION public.update_customer_with_user_context(p_customer_id uuid, p_user_id uuid, p_data jsonb)
 RETURNS SETOF people
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Set the current user ID in the session for the audit trigger
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);

    -- Perform the update operation with actual people table columns
    RETURN QUERY
    UPDATE public.people
    SET
        name = COALESCE(p_data->>'name', name)::TEXT,
        company = COALESCE(p_data->>'company', company)::TEXT,
        email = COALESCE(p_data->>'email', email)::TEXT,
        phone = COALESCE(p_data->>'phone', phone)::TEXT,
        address = COALESCE(p_data->>'address', address)::TEXT,
        city = COALESCE(p_data->>'city', city)::TEXT,
        country = COALESCE(p_data->>'country', country)::TEXT,
        is_active = COALESCE((p_data->>'is_active')::BOOLEAN, is_active),
        note = COALESCE(p_data->>'note', note)::TEXT
    WHERE id = p_customer_id
    RETURNING *;
END;
$function$
