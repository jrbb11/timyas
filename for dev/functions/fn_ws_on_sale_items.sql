CREATE OR REPLACE FUNCTION public.fn_ws_on_sale_items()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.warehouse_stock
        SET stock = stock - NEW.qty
        WHERE warehouse_id = (SELECT warehouse FROM public.sales WHERE id = NEW.sale_id)
          AND product_id = NEW.product_id;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.warehouse_stock
        SET stock = stock + OLD.qty
        WHERE warehouse_id = (SELECT warehouse FROM public.sales WHERE id = OLD.sale_id)
          AND product_id = OLD.product_id;
        RETURN OLD;

    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.warehouse_stock
        SET stock = stock + OLD.qty - NEW.qty
        WHERE warehouse_id = (SELECT warehouse FROM public.sales WHERE id = NEW.sale_id)
          AND product_id = NEW.product_id;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$function$
