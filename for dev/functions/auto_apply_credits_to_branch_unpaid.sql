CREATE OR REPLACE FUNCTION public.auto_apply_credits_to_branch_unpaid()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_people_branches_id UUID;
    v_credit_record RECORD;
    v_invoice_record RECORD;
    v_amount_to_apply NUMERIC;
BEGIN
    -- This trigger should run on franchisee_credits after INSERT or UPDATE
    v_people_branches_id := NEW.people_branches_id;

    -- Only proceed if there is a remaining amount
    IF NEW.remaining_amount <= 0 THEN
        RETURN NULL;
    END IF;

    -- Find all unpaid/partial/overdue invoices for this branch (oldest first)
    FOR v_invoice_record IN
        SELECT id, balance
        FROM franchisee_invoices
        WHERE people_branches_id = v_people_branches_id
            AND payment_status IN ('unpaid', 'partial', 'overdue')
            AND status != 'cancelled'
        ORDER BY invoice_date ASC, created_at ASC
    LOOP
        -- Calculate how much we can apply to THIS invoice
        SELECT remaining_amount INTO v_amount_to_apply
        FROM franchisee_credits
        WHERE id = NEW.id;

        IF v_amount_to_apply <= 0 THEN
            EXIT; -- Credit exhausted
        END IF;

        v_amount_to_apply := LEAST(v_amount_to_apply, v_invoice_record.balance);

        IF v_amount_to_apply > 0 THEN
            -- Apply the credit to the invoice
            PERFORM apply_credit_to_invoice(NEW.id, v_invoice_record.id, v_amount_to_apply);
        END IF;
    END LOOP;

    RETURN NULL;
END;
$function$;
