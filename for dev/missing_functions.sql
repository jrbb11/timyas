-- Missing database functions for stock management

-- Function to update timestamp when records are updated
CREATE OR REPLACE FUNCTION updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate reference codes for tables
CREATE OR REPLACE FUNCTION generate_reference_for_table()
RETURNS TRIGGER AS $$
DECLARE
    table_name TEXT;
    prefix TEXT;
    last_number INTEGER;
    new_reference TEXT;
BEGIN
    table_name := TG_TABLE_NAME;
    
    -- Set prefix based on table name
    CASE table_name
        WHEN 'products' THEN prefix := 'PRD';
        WHEN 'purchases' THEN prefix := 'PUR';
        WHEN 'sales' THEN prefix := 'SAL';
        WHEN 'adjustment_batches' THEN prefix := 'ADJ';
        ELSE prefix := 'REF';
    END CASE;
    
    -- Get last number and increment
    SELECT COALESCE(last_number, 0) + 1 INTO last_number
    FROM reference_counters
    WHERE name = table_name;
    
    -- Insert or update reference counter
    INSERT INTO reference_counters (name, last_number, prefix)
    VALUES (table_name, last_number, prefix)
    ON CONFLICT (name) DO UPDATE SET
        last_number = EXCLUDED.last_number;
    
    -- Generate new reference
    new_reference := prefix || '-' || LPAD(last_number::TEXT, 6, '0');
    
    -- Set the reference field based on table
    CASE table_name
        WHEN 'products' THEN NEW.code := new_reference;
        WHEN 'purchases' THEN NEW.reference := new_reference;
        WHEN 'sales' THEN NEW.reference := new_reference;
        WHEN 'adjustment_batches' THEN NEW.reference_code := new_reference;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle purchase stock updates
CREATE OR REPLACE FUNCTION handle_purchase_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update warehouse stock
    INSERT INTO warehouse_stock (warehouse_id, product_id, stock)
    SELECT 
        p.warehouse,
        NEW.product_id,
        COALESCE(ws.stock, 0) + NEW.qty
    FROM purchases p
    LEFT JOIN warehouse_stock ws ON ws.warehouse_id = p.warehouse AND ws.product_id = NEW.product_id
    WHERE p.id = NEW.purchase_id
    ON CONFLICT (warehouse_id, product_id) DO UPDATE SET
        stock = warehouse_stock.stock + NEW.qty;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle sale stock updates
CREATE OR REPLACE FUNCTION fn_ws_on_sale_items()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Decrease stock on sale
        UPDATE warehouse_stock 
        SET stock = stock - NEW.qty
        WHERE warehouse_id = (
            SELECT warehouse FROM sales WHERE id = NEW.sale_id
        ) AND product_id = NEW.product_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Increase stock on sale deletion
        UPDATE warehouse_stock 
        SET stock = stock + OLD.qty
        WHERE warehouse_id = (
            SELECT warehouse FROM sales WHERE id = OLD.sale_id
        ) AND product_id = OLD.product_id;
        
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle quantity changes
        UPDATE warehouse_stock 
        SET stock = stock + OLD.qty - NEW.qty
        WHERE warehouse_id = (
            SELECT warehouse FROM sales WHERE id = NEW.sale_id
        ) AND product_id = NEW.product_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to apply adjustment stock changes
CREATE OR REPLACE FUNCTION fn_apply_adjustment_stock()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Function to update account balance for deposits
CREATE OR REPLACE FUNCTION _dep_update_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE accounts 
        SET balance = balance + NEW.amount
        WHERE id = NEW.account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE accounts 
        SET balance = balance - OLD.amount
        WHERE id = OLD.account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update account balance for expenses
CREATE OR REPLACE FUNCTION _exp_update_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE accounts 
        SET balance = balance - NEW.amount
        WHERE id = NEW.account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE accounts 
        SET balance = balance + OLD.amount
        WHERE id = OLD.account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update account balance for purchase payments
CREATE OR REPLACE FUNCTION _ppay_update_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE accounts 
        SET balance = balance - NEW.amount
        WHERE id = NEW.account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE accounts 
        SET balance = balance + OLD.amount
        WHERE id = OLD.account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update account balance for sale payments
CREATE OR REPLACE FUNCTION _spay_update_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE accounts 
        SET balance = balance + NEW.amount
        WHERE id = NEW.account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE accounts 
        SET balance = balance - OLD.amount
        WHERE id = OLD.account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update account balance for transfers
CREATE OR REPLACE FUNCTION _trf_update_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE accounts 
        SET balance = balance - NEW.amount
        WHERE id = NEW.from_account_id;
        UPDATE accounts 
        SET balance = balance + NEW.amount
        WHERE id = NEW.to_account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE accounts 
        SET balance = balance + OLD.amount
        WHERE id = OLD.from_account_id;
        UPDATE accounts 
        SET balance = balance - OLD.amount
        WHERE id = OLD.to_account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create product_stock_view for aggregated stock view
CREATE OR REPLACE VIEW product_stock_view AS
SELECT 
    p.id,
    p.name,
    p.code,
    p.product_cost,
    p.product_price,
    COALESCE(SUM(ws.stock), 0) as stock,
    p.stock_alert,
    CASE 
        WHEN COALESCE(SUM(ws.stock), 0) <= p.stock_alert THEN 'Low Stock'
        WHEN COALESCE(SUM(ws.stock), 0) = 0 THEN 'Out of Stock'
        ELSE 'In Stock'
    END as stock_status
FROM products p
LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
GROUP BY p.id, p.name, p.code, p.product_cost, p.product_price, p.stock_alert; 