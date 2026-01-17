CREATE OR REPLACE FUNCTION public.trigger_auto_apply_credits()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only apply credits if invoice is not already paid
  IF NEW.paid_amount < NEW.total_amount THEN
    PERFORM auto_apply_credits_to_invoice(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$
