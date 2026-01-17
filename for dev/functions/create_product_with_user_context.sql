CREATE OR REPLACE FUNCTION public.create_product_with_user_context(p_user_id uuid, p_data jsonb)
 RETURNS SETOF products
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Set the current user ID in the session for the audit trigger
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);

    -- Perform the insert operation with actual products table columns
    RETURN QUERY
    INSERT INTO public.products (
        name, 
        code,
        brand, 
        barcode_symbology,
        category, 
        order_tax,
        tax_type,
        description, 
        type,
        product_cost, 
        product_price, 
        product_unit,
        sale_unit,
        purchase_unit,
        stock_alert,
        has_serial,
        not_for_selling,
        image_urls
    ) VALUES (
        (p_data->>'name')::TEXT,
        (p_data->>'code')::TEXT,
        (p_data->>'brand')::UUID,
        COALESCE((p_data->>'barcode_symbology')::TEXT, 'Code 128'),
        (p_data->>'category')::UUID,
        COALESCE((p_data->>'order_tax')::NUMERIC, 0),
        COALESCE((p_data->>'tax_type')::TEXT, 'Exclusive'),
        (p_data->>'description')::TEXT,
        COALESCE((p_data->>'type')::TEXT, 'Standard Product'),
        (p_data->>'product_cost')::NUMERIC,
        (p_data->>'product_price')::NUMERIC,
        (p_data->>'product_unit')::UUID,
        (p_data->>'sale_unit')::UUID,
        (p_data->>'purchase_unit')::UUID,
        COALESCE((p_data->>'stock_alert')::INTEGER, 0),
        COALESCE((p_data->>'has_serial')::BOOLEAN, FALSE),
        COALESCE((p_data->>'not_for_selling')::BOOLEAN, FALSE),
        (p_data->>'image_urls')::TEXT[]
    )
    RETURNING *;
END;
$function$
