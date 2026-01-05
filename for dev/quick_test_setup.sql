-- =====================================================
-- QUICK TEST SETUP FOR FRANCHISEE INVOICING
-- =====================================================
-- Run this script to quickly set up test data
-- =====================================================

-- 1. First, run the main schema file (franchisee_invoicing_schema.sql)
--    Copy and paste the entire file content into Supabase SQL Editor

-- 2. Then run this script to create test data

-- =====================================================
-- STEP 1: Create Test Franchisee (if you don't have one)
-- =====================================================

-- Insert test franchisee
DO $$
DECLARE
    v_person_id UUID;
    v_branch_id UUID;
    v_people_branches_id UUID;
    v_warehouse_id UUID;
    v_product_id UUID;
    v_sale_id UUID;
BEGIN
    -- Check if test franchisee exists
    SELECT id INTO v_person_id FROM people WHERE name = 'Test Franchisee Inc.' LIMIT 1;
    
    IF v_person_id IS NULL THEN
        -- Create franchisee
        INSERT INTO people (name, type, email, phone, address, city, country)
        VALUES (
            'Test Franchisee Inc.',
            'customer',
            'testfranchise@example.com',
            '0912-345-6789',
            '123 Test Street',
            'Manila',
            'Philippines'
        )
        RETURNING id INTO v_person_id;
        
        RAISE NOTICE 'Created franchisee: %', v_person_id;
    ELSE
        RAISE NOTICE 'Franchisee already exists: %', v_person_id;
    END IF;
    
    -- Check if test branch exists
    SELECT id INTO v_branch_id FROM branches WHERE code = 'TEST-BR-001' LIMIT 1;
    
    IF v_branch_id IS NULL THEN
        -- Create test branch
        INSERT INTO branches (name, code, address, city, country)
        VALUES (
            'Test Branch Manila',
            'TEST-BR-001',
            'Quezon City',
            'Manila',
            'Philippines'
        )
        RETURNING id INTO v_branch_id;
        
        RAISE NOTICE 'Created branch: %', v_branch_id;
    ELSE
        RAISE NOTICE 'Branch already exists: %', v_branch_id;
    END IF;
    
    -- Check if mapping exists
    SELECT id INTO v_people_branches_id 
    FROM people_branches 
    WHERE person_id = v_person_id AND branch_id = v_branch_id;
    
    IF v_people_branches_id IS NULL THEN
        -- Link franchisee to branch
        INSERT INTO people_branches (person_id, branch_id)
        VALUES (v_person_id, v_branch_id)
        RETURNING id INTO v_people_branches_id;
        
        RAISE NOTICE 'Created people_branches mapping: %', v_people_branches_id;
    ELSE
        RAISE NOTICE 'People_branches mapping already exists: %', v_people_branches_id;
    END IF;
    
    -- Get a warehouse
    SELECT id INTO v_warehouse_id FROM warehouses LIMIT 1;
    
    IF v_warehouse_id IS NULL THEN
        RAISE EXCEPTION 'No warehouse found. Please create at least one warehouse first.';
    END IF;
    
    -- Get a product
    SELECT id INTO v_product_id FROM products LIMIT 1;
    
    IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'No product found. Please create at least one product first.';
    END IF;
    
    -- Create test sales for December 2025
    FOR i IN 1..5 LOOP
        INSERT INTO sales (
            date,
            warehouse,
            people_branches_id,
            status,
            payment_status,
            order_tax,
            discount,
            shipping,
            total_amount,
            note
        ) VALUES (
            ('2025-12-' || LPAD(i::TEXT, 2, '0'))::DATE,
            v_warehouse_id,
            v_people_branches_id,
            'delivered',
            'paid',
            1000.00 * i,  -- Tax
            500.00 * i,   -- Discount
            0,
            (10000.00 * i) + (1000.00 * i) - (500.00 * i),  -- Total = base + tax - discount
            'Test sale ' || i || ' for invoice testing'
        )
        RETURNING id INTO v_sale_id;
        
        -- Add sale items
        INSERT INTO sale_items (
            sale_id,
            product_id,
            price,
            qty,
            discount,
            tax
        ) VALUES (
            v_sale_id,
            v_product_id,
            1000.00,
            10 * i,
            500.00 * i,
            1000.00 * i
        );
        
        RAISE NOTICE 'Created test sale %: %', i, v_sale_id;
    END LOOP;
    
    -- Display summary
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST DATA CREATED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Franchisee ID: %', v_person_id;
    RAISE NOTICE 'Branch ID: %', v_branch_id;
    RAISE NOTICE 'People Branches ID: %', v_people_branches_id;
    RAISE NOTICE '5 test sales created for December 2025';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Go to http://localhost:5173/franchisee-invoices';
    RAISE NOTICE '2. Click "Generate Invoice"';
    RAISE NOTICE '3. Select: Test Franchisee Inc. - Test Branch Manila';
    RAISE NOTICE '4. Set period: 2025-12-01 to 2025-12-31';
    RAISE NOTICE '5. Click "Preview Invoice"';
    RAISE NOTICE '========================================';
    
END $$;

-- =====================================================
-- STEP 2: Verify Test Data
-- =====================================================

-- Check franchisees with branches
SELECT 
    pb.id as people_branches_id,
    p.name as franchisee_name,
    b.name as branch_name,
    b.code as branch_code,
    COUNT(s.id) as sales_count,
    SUM(s.total_amount) as total_sales
FROM people_branches pb
JOIN people p ON pb.person_id = p.id
JOIN branches b ON pb.branch_id = b.id
LEFT JOIN sales s ON s.people_branches_id = pb.id
GROUP BY pb.id, p.name, b.name, b.code;

-- =====================================================
-- STEP 3: Test Invoice Generation (Optional - can do via UI)
-- =====================================================

-- Generate a test invoice via SQL
-- Uncomment and replace <people_branches_id> with your ID from above query

/*
SELECT generate_franchisee_invoice(
    '<people_branches_id>'::UUID,  -- Replace with actual ID
    '2025-12-01'::DATE,
    '2025-12-31'::DATE,
    30,
    NULL,
    'Test invoice generated from SQL'
) as new_invoice_id;
*/

-- =====================================================
-- STEP 4: View Generated Invoices
-- =====================================================

-- View all invoices
SELECT 
    invoice_number,
    franchisee_name,
    branch_name,
    invoice_date,
    period_start,
    period_end,
    total_amount,
    payment_status,
    status,
    item_count
FROM v_franchisee_invoice_details
ORDER BY invoice_date DESC;

-- =====================================================
-- QUICK COMMANDS FOR TESTING
-- =====================================================

-- Get franchisee summary
-- SELECT * FROM get_franchisee_invoice_summary('<franchisee_id>');

-- View outstanding invoices
-- SELECT * FROM franchisee_invoices WHERE payment_status IN ('unpaid', 'partial', 'overdue');

-- Record a payment
/*
INSERT INTO franchisee_invoice_payments (
    invoice_id,
    amount,
    payment_date,
    account_id,
    notes
) VALUES (
    '<invoice_id>',
    25000.00,
    CURRENT_DATE,
    1,
    'Test payment'
);
*/

-- =====================================================
-- CLEANUP (if you want to start over)
-- =====================================================

/*
-- Delete all test data (CAREFUL!)
DELETE FROM franchisee_invoice_payments;
DELETE FROM franchisee_invoice_items;
DELETE FROM franchisee_invoices;
DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE note LIKE 'Test sale%');
DELETE FROM sales WHERE note LIKE 'Test sale%';
DELETE FROM people_branches WHERE person_id IN (SELECT id FROM people WHERE name = 'Test Franchisee Inc.');
DELETE FROM branches WHERE code = 'TEST-BR-001';
DELETE FROM people WHERE name = 'Test Franchisee Inc.';
*/
