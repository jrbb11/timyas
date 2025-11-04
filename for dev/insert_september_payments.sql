-- Insert payment records for all September 2025 sales
-- Since payment_status is 'paid', we need to create payment records
-- This will make the sales_view.paid field show the correct amount

INSERT INTO sale_payments (sale_id, amount, payment_date, payment_method_id, account_id)
SELECT 
    s.id as sale_id,
    s.total_amount as amount,
    s.date as payment_date,
    (SELECT id FROM payment_methods LIMIT 1) as payment_method_id,
    (SELECT id FROM accounts LIMIT 1) as account_id
FROM sales s
WHERE s.date >= '2025-09-01' 
    AND s.date <= '2025-09-30'
    AND s.payment_status = 'paid'
    AND NOT EXISTS (
        SELECT 1 FROM sale_payments sp 
        WHERE sp.sale_id = s.id
    );

-- Verify the payments were inserted
SELECT 
    COUNT(*) as payment_records_inserted,
    SUM(amount) as total_paid_amount
FROM sale_payments sp
JOIN sales s ON sp.sale_id = s.id
WHERE s.date >= '2025-09-01' AND s.date <= '2025-09-30';

