CREATE OR REPLACE FUNCTION public.handle_purchase_stock()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    old_wh UUID;
    new_wh UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT warehouse INTO new_wh FROM public.purchases WHERE id = NEW.purchase_id;
        INSERT INTO public.warehouse_stock (warehouse_id, product_id, stock)
        VALUES (new_wh, NEW.product_id, NEW.qty)
        ON CONFLICT (warehouse_id, product_id) DO UPDATE SET
            stock = public.warehouse_stock.stock + NEW.qty;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        SELECT warehouse INTO old_wh FROM public.purchases WHERE id = OLD.purchase_id;
        UPDATE public.warehouse_stock
        SET stock = stock - OLD.qty
        WHERE warehouse_id = old_wh AND product_id = OLD.product_id;
        RETURN OLD;

    ELSIF TG_OP = 'UPDATE' THEN
        SELECT warehouse INTO old_wh FROM public.purchases WHERE id = OLD.purchase_id;
        SELECT warehouse INTO new_wh FROM public.purchases WHERE id = NEW.purchase_id;

        IF old_wh = new_wh AND OLD.product_id = NEW.product_id THEN
            UPDATE public.warehouse_stock
            SET stock = stock + (NEW.qty - OLD.qty)
            WHERE warehouse_id = new_wh AND product_id = NEW.product_id;
        ELSE
            UPDATE public.warehouse_stock
            SET stock = stock - OLD.qty
            WHERE warehouse_id = old_wh AND product_id = OLD.product_id;

            INSERT INTO public.warehouse_stock (warehouse_id, product_id, stock)
            VALUES (new_wh, NEW.product_id, NEW.qty)
            ON CONFLICT (warehouse_id, product_id) DO UPDATE SET
                stock = public.warehouse_stock.stock + NEW.qty;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$function$
