-- =====================================================
-- ADD SHIPPING TO FRANCHISEE INVOICE ITEMS
-- =====================================================
-- This migration adds shipping/delivery fee tracking to invoice items
-- and updates the invoice generation function to include it

-- Add shipping column to franchisee_invoice_items table
ALTER TABLE franchisee_invoice_items 
ADD COLUMN IF NOT EXISTS shipping NUMERIC(14, 2) NOT NULL DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_franchisee_invoice_items_shipping 
ON franchisee_invoice_items(shipping) WHERE shipping > 0;

-- =====================================================
-- UPDATE GENERATE FRANCHISEE INVOICE FUNCTION
-- =====================================================
-- Update the function to include shipping from sales

CREATE OR REPLACE FUNCTION generate_franchisee_invoice(
    p_people_branches_id UUID,
    p_period_start DATE,
    p_period_end DATE,
    p_due_days INTEGER DEFAULT 30,
    p_created_by UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invoice_id UUID;
    v_franchisee_id UUID;
    v_branch_id UUID;
    v_subtotal NUMERIC := 0;
    v_tax_total NUMERIC := 0;
    v_discount_total NUMERIC := 0;
    v_shipping_total NUMERIC := 0;
    v_total NUMERIC := 0;
    v_sale_record RECORD;
BEGIN
    -- Get franchisee and branch info
    SELECT person_id, branch_id INTO v_franchisee_id, v_branch_id
    FROM people_branches
    WHERE id = p_people_branches_id;
    
    IF v_franchisee_id IS NULL THEN
        RAISE EXCEPTION 'Invalid people_branches_id: %', p_people_branches_id;
    END IF;
    
    -- Create the invoice
    INSERT INTO franchisee_invoices (
        people_branches_id,
        branch_id,
        franchisee_id,
        invoice_date,
        period_start,
        period_end,
        due_date,
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
        -- Insert invoice item
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
        
        -- Accumulate totals
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
        balance = v_total,
        updated_at = NOW()
    WHERE id = v_invoice_id;
    
    RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify the shipping column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'franchisee_invoice_items' 
        AND column_name = 'shipping'
    ) THEN
        RAISE NOTICE 'SUCCESS: shipping column added to franchisee_invoice_items';
    ELSE
        RAISE EXCEPTION 'FAILED: shipping column was not added to franchisee_invoice_items';
    END IF;
END $$;

COMMENT ON COLUMN franchisee_invoice_items.shipping IS 'Shipping/delivery fee for this sale';
