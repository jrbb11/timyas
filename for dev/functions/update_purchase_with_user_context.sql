CREATE OR REPLACE FUNCTION public.update_purchase_with_user_context(p_purchase_id uuid, p_user_id uuid, p_data jsonb)
 RETURNS SETOF purchases
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Set the current user ID in the session for the audit trigger
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);

    -- Perform the update operation with actual purchases table columns
    RETURN QUERY
    UPDATE public.purchases
    SET
        date = COALESCE((p_data->>'date')::DATE, date),
        supplier = COALESCE((p_data->>'supplier')::UUID, supplier),
        warehouse = COALESCE((p_data->>'warehouse')::UUID, warehouse),
        order_tax = COALESCE((p_data->>'order_tax')::NUMERIC, order_tax),
        discount = COALESCE((p_data->>'discount')::NUMERIC, discount),
        shipping = COALESCE((p_data->>'shipping')::NUMERIC, shipping),
        status = COALESCE(p_data->>'status', status)::TEXT,
        note = COALESCE(p_data->>'note', note)::TEXT,
        total_amount = COALESCE((p_data->>'total_amount')::NUMERIC, total_amount),
        reference = COALESCE(p_data->>'reference', reference)::TEXT,
        payment_status = COALESCE(p_data->>'payment_status', payment_status)::TEXT
    WHERE id = p_purchase_id
    RETURNING *;
END;
$function$
