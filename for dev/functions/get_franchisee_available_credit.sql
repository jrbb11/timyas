CREATE OR REPLACE FUNCTION public.get_franchisee_available_credit(p_people_branches_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_credit DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(remaining_amount), 0)
  INTO total_credit
  FROM franchisee_credits
  WHERE people_branches_id = p_people_branches_id
    AND remaining_amount > 0;
  
  RETURN total_credit;
END;
$function$
