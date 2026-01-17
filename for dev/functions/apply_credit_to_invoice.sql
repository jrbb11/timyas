CREATE OR REPLACE FUNCTION public.apply_credit_to_invoice(p_credit_id uuid, p_invoice_id uuid, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_credit_branch UUID;
  v_invoice_branch UUID;
  v_remaining DECIMAL(10, 2);
BEGIN
  -- Get remaining credit and branch info
  SELECT remaining_amount, people_branches_id INTO v_remaining, v_credit_branch
  FROM franchisee_credits
  WHERE id = p_credit_id;
  
  -- Get invoice branch info
  SELECT people_branches_id INTO v_invoice_branch
  FROM franchisee_invoices
  WHERE id = p_invoice_id;
  
  -- Validate existence
  IF v_remaining IS NULL THEN
    RAISE EXCEPTION 'Credit not found';
  END IF;
  
  IF v_invoice_branch IS NULL THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;
  
  -- BRANCH ISOLATION SAFETY CHECK
  IF v_credit_branch != v_invoice_branch THEN
    RAISE EXCEPTION 'Branch mismatch: Credit belongs to a different branch than the invoice';
  END IF;
  
  -- Validate amount
  IF p_amount > v_remaining THEN
    RAISE EXCEPTION 'Amount exceeds available credit';
  END IF;
  
  -- Update credit amounts
  UPDATE franchisee_credits
  SET used_amount = used_amount + p_amount,
      remaining_amount = remaining_amount - p_amount,
      updated_at = NOW()
  WHERE id = p_credit_id;
  
  -- Record application
  INSERT INTO credit_applications (credit_id, invoice_id, amount_applied)
  VALUES (p_credit_id, p_invoice_id, p_amount);
  
  RETURN TRUE;
END;
$function$;
