-- ============================================
-- FRANCHISEE PAYMENT ADJUSTMENT SYSTEM
-- Migration: Credit Balance & Payment Adjustments
-- Created: 2026-01-16
-- ============================================

-- ============================================
-- PART 1: CREDIT BALANCE SYSTEM
-- ============================================

-- Create franchisee_credits table
CREATE TABLE IF NOT EXISTS franchisee_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchisee_id UUID REFERENCES people(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('overpayment', 'return', 'adjustment')),
  source_invoice_id UUID REFERENCES franchisee_invoices(id) ON DELETE SET NULL,
  used_amount DECIMAL(10, 2) DEFAULT 0 CHECK (used_amount >= 0),
  remaining_amount DECIMAL(10, 2) NOT NULL CHECK (remaining_amount >= 0),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_amounts CHECK (used_amount <= amount AND remaining_amount = amount - used_amount)
);

-- Create credit_applications table
CREATE TABLE IF NOT EXISTS credit_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_id UUID REFERENCES franchisee_credits(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES franchisee_invoices(id) ON DELETE CASCADE NOT NULL,
  amount_applied DECIMAL(10, 2) NOT NULL CHECK (amount_applied > 0),
  applied_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_franchisee_credits_franchisee_id ON franchisee_credits(franchisee_id);
CREATE INDEX IF NOT EXISTS idx_franchisee_credits_remaining ON franchisee_credits(remaining_amount) WHERE remaining_amount > 0;
CREATE INDEX IF NOT EXISTS idx_credit_applications_credit_id ON credit_applications(credit_id);
CREATE INDEX IF NOT EXISTS idx_credit_applications_invoice_id ON credit_applications(invoice_id);

-- Enable RLS on credit tables
ALTER TABLE franchisee_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for franchisee_credits
DROP POLICY IF EXISTS "Allow authenticated users to read credits" ON franchisee_credits;
CREATE POLICY "Allow authenticated users to read credits"
  ON franchisee_credits FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert credits" ON franchisee_credits;
CREATE POLICY "Allow authenticated users to insert credits"
  ON franchisee_credits FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update credits" ON franchisee_credits;
CREATE POLICY "Allow authenticated users to update credits"
  ON franchisee_credits FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for credit_applications
DROP POLICY IF EXISTS "Allow authenticated users to read credit applications" ON credit_applications;
CREATE POLICY "Allow authenticated users to read credit applications"
  ON credit_applications FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert credit applications" ON credit_applications;
CREATE POLICY "Allow authenticated users to insert credit applications"
  ON credit_applications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- PART 2: PAYMENT ADJUSTMENT SYSTEM
-- ============================================

-- Add adjustment fields to payments table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name='franchisee_invoice_payments' AND column_name='adjustment_type') THEN
    ALTER TABLE franchisee_invoice_payments ADD COLUMN adjustment_type VARCHAR(50) CHECK (adjustment_type IN ('reversal', 'correction') OR adjustment_type IS NULL);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name='franchisee_invoice_payments' AND column_name='original_payment_id') THEN
    ALTER TABLE franchisee_invoice_payments ADD COLUMN original_payment_id UUID REFERENCES franchisee_invoice_payments(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name='franchisee_invoice_payments' AND column_name='adjustment_reason') THEN
    ALTER TABLE franchisee_invoice_payments ADD COLUMN adjustment_reason TEXT;
  END IF;
END $$;

-- Create payment_adjustments table
CREATE TABLE IF NOT EXISTS payment_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES franchisee_invoice_payments(id) ON DELETE CASCADE NOT NULL,
  adjustment_type VARCHAR(50) NOT NULL CHECK (adjustment_type IN ('reversal', 'correction')),
  original_amount DECIMAL(10, 2) NOT NULL,
  adjusted_amount DECIMAL(10, 2) NOT NULL CHECK (adjusted_amount >= 0),
  difference DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  adjusted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  adjusted_at TIMESTAMP DEFAULT NOW()
);

-- Create index for payment_adjustments
CREATE INDEX IF NOT EXISTS idx_payment_adjustments_payment_id ON payment_adjustments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_adjustments_adjusted_at ON payment_adjustments(adjusted_at);

-- Enable RLS on payment_adjustments
ALTER TABLE payment_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read adjustments" ON payment_adjustments;
CREATE POLICY "Allow authenticated users to read adjustments"
  ON payment_adjustments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to create adjustments" ON payment_adjustments;
CREATE POLICY "Allow authenticated users to create adjustments"
  ON payment_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get available credit for a franchisee
CREATE OR REPLACE FUNCTION get_franchisee_available_credit(p_franchisee_id UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
  total_credit DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(remaining_amount), 0)
  INTO total_credit
  FROM franchisee_credits
  WHERE franchisee_id = p_franchisee_id
    AND remaining_amount > 0;
  
  RETURN total_credit;
END;
$$;

-- Function to apply credit to an invoice
CREATE OR REPLACE FUNCTION apply_credit_to_invoice(
  p_credit_id UUID,
  p_invoice_id UUID,
  p_amount DECIMAL(10, 2)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_remaining DECIMAL(10, 2);
BEGIN
  -- Get remaining credit amount
  SELECT remaining_amount INTO v_remaining
  FROM franchisee_credits
  WHERE id = p_credit_id;
  
  -- Validate amount
  IF v_remaining IS NULL THEN
    RAISE EXCEPTION 'Credit not found';
  END IF;
  
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
$$;

-- Function to automatically apply available credits to an invoice
CREATE OR REPLACE FUNCTION auto_apply_credits_to_invoice(p_invoice_id UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_franchisee_id UUID;
  v_invoice_balance DECIMAL(10, 2);
  v_credit_record RECORD;
  v_amount_to_apply DECIMAL(10, 2);
  v_total_applied DECIMAL(10, 2) := 0;
BEGIN
  -- Get invoice details
  SELECT franchisee_id, (total_amount - paid_amount) INTO v_franchisee_id, v_invoice_balance
  FROM franchisee_invoices
  WHERE id = p_invoice_id;
  
  -- Exit if invoice is already paid
  IF v_invoice_balance <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Loop through available credits (oldest first)
  FOR v_credit_record IN
    SELECT id, remaining_amount
    FROM franchisee_credits
    WHERE franchisee_id = v_franchisee_id
      AND remaining_amount > 0
    ORDER BY created_at ASC
  LOOP
    -- Calculate amount to apply (lesser of remaining credit or invoice balance)
    v_amount_to_apply := LEAST(v_credit_record.remaining_amount, v_invoice_balance);
    
    -- Apply the credit
    PERFORM apply_credit_to_invoice(v_credit_record.id, p_invoice_id, v_amount_to_apply);
    
    -- Update totals
    v_total_applied := v_total_applied + v_amount_to_apply;
    v_invoice_balance := v_invoice_balance - v_amount_to_apply;
    
    -- Exit if invoice is fully paid
    EXIT WHEN v_invoice_balance <= 0;
  END LOOP;
  
  -- Update invoice paid_amount
  UPDATE franchisee_invoices
  SET paid_amount = paid_amount + v_total_applied
  WHERE id = p_invoice_id;
  
  RETURN v_total_applied;
END;
$$;

-- Trigger to automatically apply credits when a new invoice is created
CREATE OR REPLACE FUNCTION trigger_auto_apply_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only apply credits if invoice is not already paid
  IF NEW.paid_amount < NEW.total_amount THEN
    PERFORM auto_apply_credits_to_invoice(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_apply_credits_on_invoice_creation ON franchisee_invoices;
CREATE TRIGGER auto_apply_credits_on_invoice_creation
  AFTER INSERT ON franchisee_invoices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_apply_credits();

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON franchisee_credits TO authenticated;
GRANT ALL ON credit_applications TO authenticated;
GRANT ALL ON payment_adjustments TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE franchisee_credits IS 'Tracks credit balances from overpayments, returns, and adjustments';
COMMENT ON TABLE credit_applications IS 'Records when credits are applied to invoices';
COMMENT ON TABLE payment_adjustments IS 'Audit trail for payment corrections and reversals';
COMMENT ON FUNCTION get_franchisee_available_credit IS 'Returns total available credit for a franchisee';
COMMENT ON FUNCTION apply_credit_to_invoice IS 'Applies a specific credit to an invoice';
COMMENT ON FUNCTION auto_apply_credits_to_invoice IS 'Automatically applies all available credits to an invoice';

-- ============================================
-- END OF MIGRATION
-- ============================================
