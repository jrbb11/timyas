CREATE OR REPLACE FUNCTION public.create_purchase_with_user_context(p_user_id uuid, p_data jsonb)
 RETURNS SETOF purchases
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Set the current user ID in the session for the audit trigger
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);

    -- Perform the insert operation with actual purchases table columns
    RETURN QUERY
    INSERT INTO public.purchases (
        date,
        supplier,
        warehouse,
        order_tax,
        discount,
        shipping,
        status,
        note,
        total_amount,
        reference,
        payment_status
    ) VALUES (
        (p_data->>'date')::DATE,
        (p_data->>'supplier')::UUID,
        (p_data->>'warehouse')::UUID,
        COALESCE((p_data->>'order_tax')::NUMERIC, 0),
        COALESCE((p_data->>'discount')::NUMERIC, 0),
        COALESCE((p_data->>'shipping')::NUMERIC, 0),
        COALESCE((p_data->>'status')::TEXT, 'received'),
        (p_data->>'note')::TEXT,
        (p_data->>'total_amount')::NUMERIC,
        (p_data->>'reference')::TEXT,
        COALESCE((p_data->>'payment_status')::TEXT, 'pending')
    )
    RETURNING *;
END;
$function$
