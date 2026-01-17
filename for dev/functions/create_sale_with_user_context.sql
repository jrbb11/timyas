CREATE OR REPLACE FUNCTION public.create_sale_with_user_context(p_user_id uuid, p_data jsonb)
 RETURNS SETOF sales
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Set the current user ID in the session for the audit trigger
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);

    -- Perform the insert operation
    RETURN QUERY
    INSERT INTO public.sales (
        invoice_number, date, people_branches_id, warehouse, order_tax, discount, shipping,
        status, payment_status, note, total_amount
    ) VALUES (
        (p_data->>'invoice_number')::TEXT,
        (p_data->>'date')::DATE,
        (p_data->>'people_branches_id')::UUID,
        (p_data->>'warehouse')::UUID,
        (p_data->>'order_tax')::NUMERIC,
        (p_data->>'discount')::NUMERIC,
        (p_data->>'shipping')::NUMERIC,
        (p_data->>'status')::TEXT,
        (p_data->>'payment_status')::TEXT,
        (p_data->>'note')::TEXT,
        (p_data->>'total_amount')::NUMERIC
    )
    RETURNING *;
END;
$function$
