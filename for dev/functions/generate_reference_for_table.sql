CREATE OR REPLACE FUNCTION public.generate_reference_for_table()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
    
    -- Get last number and increment (use table alias to avoid ambiguity)
    SELECT COALESCE(rc.last_number, 0) + 1 INTO last_number
    FROM reference_counters rc
    WHERE rc.name = table_name;
    
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
$function$
