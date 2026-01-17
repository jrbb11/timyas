CREATE OR REPLACE FUNCTION public.generate_franchisee_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    last_number INTEGER;
    new_invoice_number TEXT;
BEGIN
    -- Get last number and increment (default to 1 if not exists)
    SELECT COALESCE(rc.last_number, 0) + 1 INTO last_number
    FROM reference_counters rc
    WHERE rc.name = 'franchisee_invoices';
    
    -- If no row found, set to 1
    IF last_number IS NULL THEN
        last_number := 1;
    END IF;
    
    -- Insert or update reference counter
    INSERT INTO reference_counters (name, last_number, prefix)
    VALUES ('franchisee_invoices', last_number, 'FINV')
    ON CONFLICT (name) DO UPDATE SET
        last_number = EXCLUDED.last_number;
    
    -- Generate invoice number: FINV-YYYYMM-000001
    new_invoice_number := 'FINV-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(last_number::TEXT, 6, '0');
    
    NEW.invoice_number := new_invoice_number;
    
    RETURN NEW;
END;
$function$
