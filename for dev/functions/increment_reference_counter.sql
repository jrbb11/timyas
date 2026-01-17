CREATE OR REPLACE FUNCTION public.increment_reference_counter(p_name text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    last_number INTEGER;
BEGIN
    -- Get last number and increment
    SELECT COALESCE(last_number, 0) + 1 INTO last_number
    FROM reference_counters
    WHERE name = p_name;
    
    -- Insert or update reference counter
    INSERT INTO reference_counters (name, last_number, prefix)
    VALUES (p_name, last_number, '')
    ON CONFLICT (name) DO UPDATE SET
        last_number = EXCLUDED.last_number;
    
    RETURN last_number;
END;
$function$
