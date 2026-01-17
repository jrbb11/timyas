CREATE OR REPLACE FUNCTION public.auto_apply_credits_to_invoice(p_invoice_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_people_branches_id UUID;
  v_invoice_balance DECIMAL(10, 2);
  v_credit_record RECORD;
  v_amount_to_apply DECIMAL(10, 2);
  v_total_applied DECIMAL(10, 2) := 0;
BEGIN
  -- Get invoice details
  SELECT people_branches_id, (total_amount - paid_amount - credit_amount) 
  INTO v_people_branches_id, v_invoice_balance
  FROM franchisee_invoices
  WHERE id = p_invoice_id;
  
  -- Exit if invoice is already paid or has no balance
  IF v_invoice_balance <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Loop through available credits for this SPECIFIC BRANCH (oldest first)
  FOR v_credit_record IN
    SELECT id, remaining_amount
    FROM franchisee_credits
    WHERE people_branches_id = v_people_branches_id
      AND remaining_amount > 0
    ORDER BY created_at ASC
  LOOP
    -- Calculate amount to apply
    v_amount_to_apply := LEAST(v_credit_record.remaining_amount, v_invoice_balance);
    
    -- Apply the credit
    PERFORM apply_credit_to_invoice(v_credit_record.id, p_invoice_id, v_amount_to_apply);
    
    -- Update totals
    v_total_applied := v_total_applied + v_amount_to_apply;
    v_invoice_balance := v_invoice_balance - v_amount_to_apply;
    
    -- Exit if invoice is fully paid
    EXIT WHEN v_invoice_balance <= 0;
  END LOOP;
  
  RETURN v_total_applied;
END;
$function$;
