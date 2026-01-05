-- =====================================================
-- FRANCHISEE INVOICING SYSTEM
-- =====================================================
-- This schema handles invoicing for franchisees based on their sales
-- and purchases from the main warehouse/company
-- =====================================================

-- =====================================================
-- REFERENCE COUNTERS TABLE (IF NOT EXISTS)
-- =====================================================
-- Required for generating invoice numbers
-- If this table already exists in your database, this will be skipped

CREATE TABLE IF NOT EXISTS public.reference_counters (
    name TEXT NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0,
    prefix TEXT NOT NULL DEFAULT ''::TEXT,
    CONSTRAINT reference_counters_pkey PRIMARY KEY (name)
) TABLESPACE pg_default;

-- Insert franchisee_invoices counter if not exists
INSERT INTO public.reference_counters (name, last_number, prefix)
VALUES ('franchisee_invoices', 0, 'FINV')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- FRANCHISEE INVOICES TABLE
-- =====================================================
-- Main table to track invoices issued to franchisees

CREATE TABLE public.franchisee_invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    people_branches_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    franchisee_id UUID NOT NULL,
    
    -- Date and period information
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Financial fields
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    adjustment_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    
    -- Payment tracking
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    
    -- Status and notes
    status TEXT NOT NULL DEFAULT 'draft',
    notes TEXT NULL,
    terms_conditions TEXT NULL,
    
    -- Audit fields
    created_by UUID NULL,
    approved_by UUID NULL,
    approved_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT franchisee_invoices_pkey PRIMARY KEY (id),
    CONSTRAINT franchisee_invoices_invoice_number_key UNIQUE (invoice_number),
    CONSTRAINT franchisee_invoices_people_branches_fkey FOREIGN KEY (people_branches_id) REFERENCES people_branches (id) ON DELETE RESTRICT,
    CONSTRAINT franchisee_invoices_branch_fkey FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE RESTRICT,
    CONSTRAINT franchisee_invoices_franchisee_fkey FOREIGN KEY (franchisee_id) REFERENCES people (id) ON DELETE RESTRICT,
    CONSTRAINT franchisee_invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES app_users (id) ON DELETE SET NULL,
    CONSTRAINT franchisee_invoices_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES app_users (id) ON DELETE SET NULL,
    CONSTRAINT franchisee_invoices_status_check CHECK (status = ANY (ARRAY['draft'::TEXT, 'sent'::TEXT, 'approved'::TEXT, 'cancelled'::TEXT])),
    CONSTRAINT franchisee_invoices_payment_status_check CHECK (payment_status = ANY (ARRAY['unpaid'::TEXT, 'partial'::TEXT, 'paid'::TEXT, 'overdue'::TEXT]))
) TABLESPACE pg_default;

CREATE INDEX idx_franchisee_invoices_franchisee ON franchisee_invoices(franchisee_id);
CREATE INDEX idx_franchisee_invoices_branch ON franchisee_invoices(branch_id);
CREATE INDEX idx_franchisee_invoices_period ON franchisee_invoices(period_start, period_end);
CREATE INDEX idx_franchisee_invoices_status ON franchisee_invoices(status, payment_status);
CREATE INDEX idx_franchisee_invoices_date ON franchisee_invoices(invoice_date);

-- =====================================================
-- FRANCHISEE INVOICE ITEMS TABLE
-- =====================================================
-- Line items for each invoice (linked to actual sales)

CREATE TABLE public.franchisee_invoice_items (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    sale_id UUID NOT NULL,
    
    -- Item details
    description TEXT NOT NULL,
    sale_reference TEXT NOT NULL,
    sale_date DATE NOT NULL,
    
    -- Financial details
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(14, 2) NOT NULL DEFAULT 0,
    line_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT franchisee_invoice_items_pkey PRIMARY KEY (id),
    CONSTRAINT franchisee_invoice_items_invoice_fkey FOREIGN KEY (invoice_id) REFERENCES franchisee_invoices (id) ON DELETE CASCADE,
    CONSTRAINT franchisee_invoice_items_sale_fkey FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE RESTRICT
) TABLESPACE pg_default;

CREATE INDEX idx_franchisee_invoice_items_invoice ON franchisee_invoice_items(invoice_id);
CREATE INDEX idx_franchisee_invoice_items_sale ON franchisee_invoice_items(sale_id);

-- =====================================================
-- FRANCHISEE INVOICE PAYMENTS TABLE
-- =====================================================
-- Track payments made against franchisee invoices

CREATE TABLE public.franchisee_invoice_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    
    -- Payment details
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(14, 2) NOT NULL,
    payment_method_id INTEGER NULL,
    reference_number TEXT NULL,
    
    -- Account tracking
    account_id INTEGER NOT NULL,
    
    -- Additional info
    notes TEXT NULL,
    receipt_url TEXT NULL,
    
    created_by UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT franchisee_invoice_payments_pkey PRIMARY KEY (id),
    CONSTRAINT franchisee_invoice_payments_invoice_fkey FOREIGN KEY (invoice_id) REFERENCES franchisee_invoices (id) ON DELETE CASCADE,
    CONSTRAINT franchisee_invoice_payments_payment_method_fkey FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id) ON DELETE SET NULL,
    CONSTRAINT franchisee_invoice_payments_account_fkey FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE RESTRICT,
    CONSTRAINT franchisee_invoice_payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES people (id) ON DELETE SET NULL,
    CONSTRAINT franchisee_invoice_payments_amount_check CHECK (amount > 0)
) TABLESPACE pg_default;

CREATE INDEX idx_franchisee_invoice_payments_invoice ON franchisee_invoice_payments(invoice_id);
CREATE INDEX idx_franchisee_invoice_payments_date ON franchisee_invoice_payments(payment_date);

-- =====================================================
-- INVOICE NUMBER GENERATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_franchisee_invoice_number()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_franchisee_invoice_number
    BEFORE INSERT ON franchisee_invoices
    FOR EACH ROW
    WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
    EXECUTE FUNCTION generate_franchisee_invoice_number();

-- =====================================================
-- UPDATE INVOICE PAYMENT STATUS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_franchisee_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    invoice_id UUID;
    total_paid NUMERIC;
    invoice_total NUMERIC;
    invoice_due_date DATE;
    is_overdue BOOLEAN;
BEGIN
    invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Get total paid for this invoice
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM franchisee_invoice_payments
    WHERE franchisee_invoice_payments.invoice_id = update_franchisee_invoice_payment_status.invoice_id;
    
    -- Get invoice total and due date
    SELECT total_amount, due_date INTO invoice_total, invoice_due_date
    FROM franchisee_invoices
    WHERE id = update_franchisee_invoice_payment_status.invoice_id;
    
    -- Check if overdue
    is_overdue := (CURRENT_DATE > invoice_due_date) AND (total_paid < invoice_total);
    
    -- Update payment status and balance
    UPDATE franchisee_invoices
    SET 
        paid_amount = total_paid,
        balance = invoice_total - total_paid,
        payment_status = CASE
            WHEN total_paid = 0 AND is_overdue THEN 'overdue'
            WHEN total_paid = 0 THEN 'unpaid'
            WHEN total_paid < invoice_total AND is_overdue THEN 'overdue'
            WHEN total_paid < invoice_total THEN 'partial'
            ELSE 'paid'
        END,
        updated_at = NOW()
    WHERE id = update_franchisee_invoice_payment_status.invoice_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_franchisee_invoice_payment_status
    AFTER INSERT OR UPDATE OR DELETE ON franchisee_invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_franchisee_invoice_payment_status();

-- =====================================================
-- UPDATE ACCOUNT BALANCE FOR FRANCHISEE INVOICE PAYMENTS
-- =====================================================

CREATE OR REPLACE FUNCTION update_account_balance_franchisee_invoice()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Credit the account when payment is received
        UPDATE accounts
        SET balance = balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Debit the account when payment is deleted
        UPDATE accounts
        SET balance = balance - OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_franchisee_invoice_payment_balance
    AFTER INSERT OR DELETE ON franchisee_invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance_franchisee_invoice();

-- =====================================================
-- HELPER FUNCTION: Generate Invoice for Franchisee
-- =====================================================
-- This function generates an invoice for a franchisee based on their sales within a date range

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
            COUNT(si.id) as item_count
        FROM sales s
        LEFT JOIN sale_items si ON si.sale_id = s.id
        WHERE s.people_branches_id = p_people_branches_id
            AND s.date BETWEEN p_period_start AND p_period_end
            AND s.status != 'cancel'
        GROUP BY s.id, s.reference, s.date, s.total_amount, s.discount, s.order_tax
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
            line_total
        ) VALUES (
            v_invoice_id,
            v_sale_record.sale_id,
            'Sale ' || v_sale_record.reference || ' (' || v_sale_record.item_count || ' items)',
            v_sale_record.reference,
            v_sale_record.sale_date,
            1,
            v_sale_record.total_amount + v_sale_record.discount - v_sale_record.order_tax,
            v_sale_record.discount,
            v_sale_record.order_tax,
            v_sale_record.total_amount
        );
        
        -- Accumulate totals
        v_subtotal := v_subtotal + v_sale_record.total_amount + v_sale_record.discount - v_sale_record.order_tax;
        v_discount_total := v_discount_total + v_sale_record.discount;
        v_tax_total := v_tax_total + v_sale_record.order_tax;
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
-- HELPER FUNCTION: Get Franchisee Invoice Summary
-- =====================================================

CREATE OR REPLACE FUNCTION get_franchisee_invoice_summary(p_franchisee_id UUID)
RETURNS TABLE (
    total_invoices BIGINT,
    total_amount NUMERIC,
    total_paid NUMERIC,
    total_outstanding NUMERIC,
    overdue_amount NUMERIC,
    overdue_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_invoices,
        COALESCE(SUM(fi.total_amount), 0) as total_amount,
        COALESCE(SUM(fi.paid_amount), 0) as total_paid,
        COALESCE(SUM(fi.balance), 0) as total_outstanding,
        COALESCE(SUM(CASE WHEN fi.payment_status = 'overdue' THEN fi.balance ELSE 0 END), 0) as overdue_amount,
        COUNT(CASE WHEN fi.payment_status = 'overdue' THEN 1 END)::BIGINT as overdue_count
    FROM franchisee_invoices fi
    WHERE fi.franchisee_id = p_franchisee_id
        AND fi.status != 'cancelled';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW: Franchisee Invoice Details
-- =====================================================

CREATE OR REPLACE VIEW v_franchisee_invoice_details AS
SELECT 
    fi.id,
    fi.invoice_number,
    fi.invoice_date,
    fi.period_start,
    fi.period_end,
    fi.due_date,
    fi.status,
    fi.payment_status,
    fi.total_amount,
    fi.paid_amount,
    fi.balance,
    
    -- Franchisee details
    p.id as franchisee_id,
    p.name as franchisee_name,
    p.email as franchisee_email,
    p.phone as franchisee_phone,
    p.address as franchisee_address,
    
    -- Branch details
    b.id as branch_id,
    b.name as branch_name,
    b.code as branch_code,
    b.address as branch_address,
    
    -- Item count
    (SELECT COUNT(*) FROM franchisee_invoice_items WHERE invoice_id = fi.id) as item_count,
    
    -- Payment count
    (SELECT COUNT(*) FROM franchisee_invoice_payments WHERE invoice_id = fi.id) as payment_count,
    
    -- Days overdue
    CASE 
        WHEN fi.payment_status IN ('overdue', 'partial') AND CURRENT_DATE > fi.due_date 
        THEN CURRENT_DATE - fi.due_date 
        ELSE 0 
    END as days_overdue,
    
    fi.created_at,
    fi.updated_at
FROM franchisee_invoices fi
JOIN people p ON fi.franchisee_id = p.id
JOIN branches b ON fi.branch_id = b.id;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE franchisee_invoices IS 'Invoices issued to franchisees for their sales/purchases during a billing period';
COMMENT ON TABLE franchisee_invoice_items IS 'Line items in franchisee invoices, typically linked to actual sales';
COMMENT ON TABLE franchisee_invoice_payments IS 'Payments received against franchisee invoices';
COMMENT ON FUNCTION generate_franchisee_invoice IS 'Generates an invoice for a franchisee based on sales within a date range';
COMMENT ON FUNCTION get_franchisee_invoice_summary IS 'Returns summary statistics for a franchisee invoices';

-- =====================================================
-- SAMPLE DATA / TESTING
-- =====================================================

-- Example: Generate an invoice for a franchisee
-- SELECT generate_franchisee_invoice(
--     '<people_branches_id>',
--     '2025-01-01'::DATE,
--     '2025-01-31'::DATE,
--     30,
--     '<user_id>',
--     'Monthly invoice for January 2025'
-- );

-- Example: Get franchisee invoice summary
-- SELECT * FROM get_franchisee_invoice_summary('<franchisee_id>');

-- Example: Query invoice details
-- SELECT * FROM v_franchisee_invoice_details WHERE franchisee_id = '<franchisee_id>' ORDER BY invoice_date DESC;
