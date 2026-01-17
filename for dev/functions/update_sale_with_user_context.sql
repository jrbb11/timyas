CREATE OR REPLACE FUNCTION public.update_sale_with_user_context(p_sale_id uuid, p_user_id uuid, p_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Set the current user ID in the session
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
    
    -- Perform the update
    UPDATE public.sales 
    SET 
        invoice_number = COALESCE((p_data->>'invoice_number')::TEXT, invoice_number),
        date = COALESCE((p_data->>'date')::DATE, date),
        people_branches_id = COALESCE((p_data->>'people_branches_id')::UUID, people_branches_id),
        warehouse = COALESCE((p_data->>'warehouse')::UUID, warehouse),
        order_tax = COALESCE((p_data->>'order_tax')::NUMERIC, order_tax),
        discount = COALESCE((p_data->>'discount')::NUMERIC, discount),
        shipping = COALESCE((p_data->>'shipping')::NUMERIC, shipping),
        status = COALESCE((p_data->>'status')::TEXT, status),
        payment_status = COALESCE((p_data->>'payment_status')::TEXT, payment_status),
        note = COALESCE((p_data->>'note')::TEXT, note),
        total_amount = COALESCE((p_data->>'total_amount')::NUMERIC, total_amount)
    WHERE id = p_sale_id;
END;
$function$
