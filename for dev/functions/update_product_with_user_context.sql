CREATE OR REPLACE FUNCTION public.update_product_with_user_context(p_product_id uuid, p_user_id uuid, p_data jsonb)
 RETURNS SETOF products
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Set the current user ID in the session for the audit trigger
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);

    -- Perform the update operation with actual products table columns
    RETURN QUERY
    UPDATE public.products
    SET
        name = COALESCE(p_data->>'name', name)::TEXT,
        code = COALESCE(p_data->>'code', code)::TEXT,
        brand = COALESCE((p_data->>'brand')::UUID, brand),
        barcode_symbology = COALESCE(p_data->>'barcode_symbology', barcode_symbology)::TEXT,
        category = COALESCE((p_data->>'category')::UUID, category),
        order_tax = COALESCE((p_data->>'order_tax')::NUMERIC, order_tax),
        tax_type = COALESCE(p_data->>'tax_type', tax_type)::TEXT,
        description = COALESCE(p_data->>'description', description)::TEXT,
        type = COALESCE(p_data->>'type', type)::TEXT,
        product_cost = COALESCE((p_data->>'product_cost')::NUMERIC, product_cost),
        product_price = COALESCE((p_data->>'product_price')::NUMERIC, product_price),
        product_unit = COALESCE((p_data->>'product_unit')::UUID, product_unit),
        sale_unit = COALESCE((p_data->>'sale_unit')::UUID, sale_unit),
        purchase_unit = COALESCE((p_data->>'purchase_unit')::UUID, purchase_unit),
        stock_alert = COALESCE((p_data->>'stock_alert')::INTEGER, stock_alert),
        has_serial = COALESCE((p_data->>'has_serial')::BOOLEAN, has_serial),
        not_for_selling = COALESCE((p_data->>'not_for_selling')::BOOLEAN, not_for_selling),
        image_urls = COALESCE((p_data->>'image_urls')::TEXT[], image_urls)
    WHERE id = p_product_id
    RETURNING *;
END;
$function$
