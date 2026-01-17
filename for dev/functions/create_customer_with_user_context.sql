CREATE OR REPLACE FUNCTION public.create_customer_with_user_context(p_user_id uuid, p_data jsonb)
 RETURNS SETOF people
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Set the current user ID in the session for the audit trigger
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);

    -- Perform the insert operation with actual people table columns
    RETURN QUERY
    INSERT INTO public.people (
        type,
        name, 
        company,
        email, 
        phone, 
        address, 
        city, 
        country, 
        is_active, 
        note,
        user_id
    ) VALUES (
        'customer'::TEXT,
        (p_data->>'name')::TEXT,
        (p_data->>'company')::TEXT,
        (p_data->>'email')::TEXT,
        (p_data->>'phone')::TEXT,
        (p_data->>'address')::TEXT,
        (p_data->>'city')::TEXT,
        (p_data->>'country')::TEXT,
        COALESCE((p_data->>'is_active')::BOOLEAN, TRUE),
        (p_data->>'note')::TEXT,
        p_user_id
    )
    RETURNING *;
END;
$function$
