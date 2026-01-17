CREATE OR REPLACE FUNCTION public.fn_apply_adjustment_stock()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    current_stock INTEGER;
    new_stock INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get current stock (default to 0 if no row exists)
        SELECT COALESCE(ws.stock, 0) INTO current_stock
        FROM adjustment_batches ab
        LEFT JOIN warehouse_stock ws ON ab.warehouse = ws.warehouse_id AND ws.product_id = NEW.product_id
        WHERE ab.id = NEW.adjustment_batch_id;

        -- Calculate new stock
        IF NEW.type = 'addition' THEN
            new_stock := current_stock + NEW.quantity;
        ELSE
            new_stock := current_stock - NEW.quantity;
        END IF;

        -- Update before and after stock
        NEW.before_stock := current_stock;
        NEW.after_stock := new_stock;

        -- Update warehouse stock
        INSERT INTO warehouse_stock (warehouse_id, product_id, stock)
        SELECT 
            ab.warehouse,
            NEW.product_id,
            new_stock
        FROM adjustment_batches ab
        WHERE ab.id = NEW.adjustment_batch_id
        ON CONFLICT (warehouse_id, product_id) DO UPDATE SET
            stock = EXCLUDED.stock;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Reverse the adjustment
        IF OLD.type = 'addition' THEN
            UPDATE warehouse_stock 
            SET stock = stock - OLD.quantity
            WHERE warehouse_id = (
                SELECT warehouse FROM adjustment_batches WHERE id = OLD.adjustment_batch_id
            ) AND product_id = OLD.product_id;
        ELSE
            UPDATE warehouse_stock 
            SET stock = stock + OLD.quantity
            WHERE warehouse_id = (
                SELECT warehouse FROM adjustment_batches WHERE id = OLD.adjustment_batch_id
            ) AND product_id = OLD.product_id;
        END IF;

        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle updates (complex - would need to reverse old and apply new)
        -- For simplicity, we'll just reapply the adjustment
        PERFORM fn_apply_adjustment_stock() FROM (SELECT OLD.*) AS old_row;
        PERFORM fn_apply_adjustment_stock() FROM (SELECT NEW.*) AS new_row;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$function$
