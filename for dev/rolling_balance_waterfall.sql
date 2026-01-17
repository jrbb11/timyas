-- ========================================================
-- MIGRATION: ROLLING BALANCE & WATERFALL PAYMENTS
-- ========================================================

BEGIN;

-- 1. Add previous_balance to franchisee_invoices
ALTER TABLE public.franchisee_invoices 
ADD COLUMN IF NOT EXISTS previous_balance numeric(14, 2) not null default 0;

-- 2. Create function to automatically apply credits to any unpaid invoice of a branch
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
        -- We re-fetch NEW.remaining_amount logic locally to handle multiple iterations
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

-- 3. Install Trigger on franchisee_credits
-- This ensures that whenever a credit is created (like from an overpayment on a NEW invoice),
-- it immediately "waterfalls" to OLDER invoices.
DROP TRIGGER IF EXISTS trg_auto_waterfall_credits ON public.franchisee_credits;
CREATE TRIGGER trg_auto_waterfall_credits
AFTER INSERT OR UPDATE OF remaining_amount ON public.franchisee_credits
FOR EACH ROW
WHEN (NEW.remaining_amount > 0)
EXECUTE FUNCTION auto_apply_credits_to_branch_unpaid();

-- 4. Update the generate_franchisee_invoice function to handle previous_balance
CREATE OR REPLACE FUNCTION public.generate_franchisee_invoice(p_people_branches_id uuid, p_period_start date, p_period_end date, p_due_days integer DEFAULT 30, p_created_by uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_invoice_id UUID;
    v_franchisee_id UUID;
    v_branch_id UUID;
    v_subtotal NUMERIC := 0;
    v_tax_total NUMERIC := 0;
    v_discount_total NUMERIC := 0;
    v_shipping_total NUMERIC := 0;
    v_total NUMERIC := 0;
    v_previous_balance NUMERIC := 0;
    v_sale_record RECORD;
BEGIN
    -- Get franchisee and branch info
    SELECT person_id, branch_id INTO v_franchisee_id, v_branch_id
    FROM people_branches
    WHERE id = p_people_branches_id;
    
    IF v_franchisee_id IS NULL THEN
        RAISE EXCEPTION 'Invalid people_branches_id: %', p_people_branches_id;
    END IF;

    -- CALCULATE ARREARS (Unpaid balance from historical invoices)
    SELECT COALESCE(SUM(balance), 0) INTO v_previous_balance
    FROM franchisee_invoices
    WHERE people_branches_id = p_people_branches_id
        AND payment_status IN ('unpaid', 'partial', 'overdue')
        AND status != 'cancelled';
    
    -- Create the invoice
    INSERT INTO franchisee_invoices (
        people_branches_id,
        branch_id,
        franchisee_id,
        invoice_date,
        period_start,
        period_end,
        due_date,
        previous_balance,
        created_by,
        notes,
        status
    ) VALUES (
        p_people_branches_id,
        v_branch_id,
        v_franchisee_id,
        CURRENT_DATE,
        p_period_start,
        p_period_end,
        CURRENT_DATE + p_due_days,
        v_previous_balance,
        p_created_by,
        p_notes,
        'draft'
    )
    RETURNING id INTO v_invoice_id;
    
    -- Add invoice items from sales
    FOR v_sale_record IN
        SELECT 
            s.id as sale_id,
            s.reference,
            s.date as sale_date,
            s.total_amount,
            s.discount,
            s.order_tax,
            s.shipping,
            COUNT(si.id) as item_count,
            COALESCE(SUM(si.qty), 0) as total_quantity,
            STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) as product_names
        FROM sales s
        LEFT JOIN sale_items si ON si.sale_id = s.id
        LEFT JOIN products p ON si.product_id = p.id
        WHERE s.people_branches_id = p_people_branches_id
            AND s.date BETWEEN p_period_start AND p_period_end
            AND s.status != 'cancel'
        GROUP BY s.id, s.reference, s.date, s.total_amount, s.discount, s.order_tax, s.shipping
    LOOP
        INSERT INTO franchisee_invoice_items (
            invoice_id,
            sale_id,
            description,
            sale_reference,
            sale_date,
            quantity,
            unit_price,
            discount,
            tax,
            shipping,
            line_total
        ) VALUES (
            v_invoice_id,
            v_sale_record.sale_id,
            COALESCE(v_sale_record.product_names, 'Sale ' || v_sale_record.reference),
            v_sale_record.reference,
            v_sale_record.sale_date,
            v_sale_record.total_quantity,
            (v_sale_record.total_amount + v_sale_record.discount - v_sale_record.order_tax - COALESCE(v_sale_record.shipping, 0)) / NULLIF(v_sale_record.total_quantity, 0),
            v_sale_record.discount,
            v_sale_record.order_tax,
            COALESCE(v_sale_record.shipping, 0),
            v_sale_record.total_amount
        );
        
        v_subtotal := v_subtotal + v_sale_record.total_amount + v_sale_record.discount - v_sale_record.order_tax - COALESCE(v_sale_record.shipping, 0);
        v_discount_total := v_discount_total + v_sale_record.discount;
        v_tax_total := v_tax_total + v_sale_record.order_tax;
        v_shipping_total := v_shipping_total + COALESCE(v_sale_record.shipping, 0);
        v_total := v_total + v_sale_record.total_amount;
    END LOOP;
    
    -- Update invoice totals
    UPDATE franchisee_invoices
    SET 
        subtotal = v_subtotal,
        discount = v_discount_total,
        tax_amount = v_tax_total,
        total_amount = v_total,
        balance = v_total, -- Note: Initial balance is just the new charges. 
                          -- The previous_balance is carried for display/collection.
        updated_at = NOW()
    WHERE id = v_invoice_id;

    -- AUTO-APPLY ANY EXISTING CREDITS
    PERFORM auto_apply_credits_to_invoice(v_invoice_id);
    
    RETURN v_invoice_id;
END;
$function$;

COMMIT;
