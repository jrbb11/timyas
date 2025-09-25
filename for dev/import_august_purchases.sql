-- Import August 2025 Purchase Data (26 records)
-- Based on Google Sheets data provided by user
-- Total: ₱2,800,000+ (calculated manually)

-- Insert August purchases
INSERT INTO purchases (date, supplier, warehouse, status, payment_status, total_amount, note) VALUES
('2025-08-04', '9ff442a0-3100-4e0e-b974-71287ecfe587', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 393254.40, '27296 - ART FRESH CHICKEN CORP - 1995 pieces, 2340.8 kilos'),
('2025-08-08', '9ff442a0-3100-4e0e-b974-71287ecfe587', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 195165.60, '27459 - ART FRESH CHICKEN CORP - 1020 pieces, 1161.7 kilos'),
('2025-08-15', '9ff442a0-3100-4e0e-b974-71287ecfe587', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 172452.00, '27680 - ART FRESH CHICKEN CORP - 900 pieces, 1026.5 kilos'),
('2025-08-22', '9ff442a0-3100-4e0e-b974-71287ecfe587', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 418682.40, '019241 - ART FRESH CHICKEN CORP - 2145 pieces, 2434.2 kilos'),
('2025-08-27', '9ff442a0-3100-4e0e-b974-71287ecfe587', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 201969.60, '019123 - ART FRESH CHICKEN CORP - 1050 pieces, 1202.2 kilos'),
('2025-08-01', '24902437-7ed9-44c1-b789-58ecfe90e993', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 30627.81, '001208 - BENEDICTO DEL PILAR - 149 pieces, 179.11 kilos'),
('2025-08-01', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 54075.00, ' - PMC DRESSED CHICKEN - 270 pieces, 309 kilos'),
('2025-08-05', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 51068.00, '000166 - PMC DRESSED CHICKEN - 270 pieces, 300.4 kilos'),
('2025-08-06', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 53023.00, '000168 - PMC DRESSED CHICKEN - 270 pieces, 311.9 kilos'),
('2025-08-06', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 53244.00, '000167 - PMC DRESSED CHICKEN - 280 pieces, 313.2 kilos'),
('2025-08-07', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 58123.00, '000169 - PMC DRESSED CHICKEN - 300 pieces, 341.9 kilos'),
('2025-08-11', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 57562.00, '000170 - PMC DRESSED CHICKEN - 300 pieces, 338.6 kilos'),
('2025-08-11', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 41718.00, '000172 - PMC DRESSED CHICKEN - 220 pieces, 245.4 kilos'),
('2025-08-12', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 23953.00, '000171 - PMC DRESSED CHICKEN - 130 pieces, 140.9 kilos'),
('2025-08-13', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 36652.00, '000173 - PMC DRESSED CHICKEN - 200 pieces, 215.6 kilos'),
('2025-08-13', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 95064.00, '000174 - PMC DRESSED CHICKEN - 500 pieces, 559.2 kilos'),
('2025-08-14', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 114920.00, '000175 - PMC DRESSED CHICKEN - 600 pieces, 676 kilos'),
('2025-08-14', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 111860.00, '000177 - PMC DRESSED CHICKEN - 590 pieces, 658 kilos'),
('2025-08-16', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 94146.00, '000178 - PMC DRESSED CHICKEN - 500 pieces, 553.8 kilos'),
('2025-08-18', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 138720.00, '000179 - PMC DRESSED CHICKEN - 740 pieces, 816 kilos'),
('2025-08-19', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 174692.00, '000180 - PMC DRESSED CHICKEN - 900 pieces, 1027.6 kilos'),
('2025-08-20', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 38352.00, '000181 - PMC DRESSED CHICKEN - 200 pieces, 225.6 kilos'),
('2025-08-27', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 65229.00, '000182 - PMC DRESSED CHICKEN - 340 pieces, 383.7 kilos'),
('2025-08-27', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 80393.00, '000183 - PMC DRESSED CHICKEN - 420 pieces, 472.9 kilos'),
('2025-08-29', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 87645.60, '000184 - PMC DRESSED CHICKEN - 460 pieces, 521.7 kilos'),
('2025-08-30', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 20680.80, '000185 - PMC DRESSED CHICKEN - 110 pieces, 123.1 kilos');

-- Now insert purchase items for each purchase
-- We'll use the CHICKEN product (PRD-000001) for all items
INSERT INTO purchase_items (purchase_id, product_id, product_name, product_code, cost, qty, kilos, unit) 
SELECT 
    p.id as purchase_id,
    (SELECT id FROM products WHERE code = 'PRD-000001') as product_id,
    'CHICKEN' as product_name,
    'PRD-000001' as product_code,
    -- Calculate cost as total_amount / qty (subtotal/qty = cost per piece)
    CASE 
        WHEN p.note LIKE '%1995 pieces%' THEN 393254.40 / 1995
        WHEN p.note LIKE '%1020 pieces%' THEN 195165.60 / 1020
        WHEN p.note LIKE '%900 pieces%' THEN 172452.00 / 900
        WHEN p.note LIKE '%2145 pieces%' THEN 418682.40 / 2145
        WHEN p.note LIKE '%1050 pieces%' THEN 201969.60 / 1050
        WHEN p.note LIKE '%149 pieces%' THEN 30627.81 / 149
        WHEN p.note LIKE '%270 pieces%' THEN 54075.00 / 270
        WHEN p.note LIKE '%280 pieces%' THEN 53244.00 / 280
        WHEN p.note LIKE '%300 pieces%' THEN 
            CASE 
                WHEN p.total_amount = 58123.00 THEN 58123.00 / 300
                WHEN p.total_amount = 57562.00 THEN 57562.00 / 300
                ELSE 190.00
            END
        WHEN p.note LIKE '%220 pieces%' THEN 41718.00 / 220
        WHEN p.note LIKE '%130 pieces%' THEN 23953.00 / 130
        WHEN p.note LIKE '%200 pieces%' THEN 36652.00 / 200
        WHEN p.note LIKE '%500 pieces%' THEN 
            CASE 
                WHEN p.total_amount = 95064.00 THEN 95064.00 / 500
                WHEN p.total_amount = 94146.00 THEN 94146.00 / 500
                ELSE 190.00
            END
        WHEN p.note LIKE '%600 pieces%' THEN 114920.00 / 600
        WHEN p.note LIKE '%590 pieces%' THEN 111860.00 / 590
        WHEN p.note LIKE '%740 pieces%' THEN 138720.00 / 740
        WHEN p.note LIKE '%340 pieces%' THEN 65229.00 / 340
        WHEN p.note LIKE '%420 pieces%' THEN 80393.00 / 420
        WHEN p.note LIKE '%460 pieces%' THEN 87645.60 / 460
        WHEN p.note LIKE '%110 pieces%' THEN 20680.80 / 110
        ELSE 190.00
    END as cost,
    CASE 
        WHEN p.note LIKE '%1995 pieces%' THEN 1995
        WHEN p.note LIKE '%1020 pieces%' THEN 1020
        WHEN p.note LIKE '%900 pieces%' THEN 900
        WHEN p.note LIKE '%2145 pieces%' THEN 2145
        WHEN p.note LIKE '%1050 pieces%' THEN 1050
        WHEN p.note LIKE '%149 pieces%' THEN 149
        WHEN p.note LIKE '%270 pieces%' THEN 270
        WHEN p.note LIKE '%280 pieces%' THEN 280
        WHEN p.note LIKE '%300 pieces%' THEN 300
        WHEN p.note LIKE '%220 pieces%' THEN 220
        WHEN p.note LIKE '%130 pieces%' THEN 130
        WHEN p.note LIKE '%200 pieces%' THEN 200
        WHEN p.note LIKE '%500 pieces%' THEN 500
        WHEN p.note LIKE '%600 pieces%' THEN 600
        WHEN p.note LIKE '%590 pieces%' THEN 590
        WHEN p.note LIKE '%740 pieces%' THEN 740
        WHEN p.note LIKE '%340 pieces%' THEN 340
        WHEN p.note LIKE '%420 pieces%' THEN 420
        WHEN p.note LIKE '%460 pieces%' THEN 460
        WHEN p.note LIKE '%110 pieces%' THEN 110
        ELSE 1
    END as qty,
    CASE 
        WHEN p.note LIKE '%2340.8 kilos%' THEN 2340.8
        WHEN p.note LIKE '%1161.7 kilos%' THEN 1161.7
        WHEN p.note LIKE '%1026.5 kilos%' THEN 1026.5
        WHEN p.note LIKE '%2434.2 kilos%' THEN 2434.2
        WHEN p.note LIKE '%1202.2 kilos%' THEN 1202.2
        WHEN p.note LIKE '%179.11 kilos%' THEN 179.11
        WHEN p.note LIKE '%309 kilos%' THEN 309.0
        WHEN p.note LIKE '%300.4 kilos%' THEN 300.4
        WHEN p.note LIKE '%311.9 kilos%' THEN 311.9
        WHEN p.note LIKE '%313.2 kilos%' THEN 313.2
        WHEN p.note LIKE '%341.9 kilos%' THEN 341.9
        WHEN p.note LIKE '%338.6 kilos%' THEN 338.6
        WHEN p.note LIKE '%245.4 kilos%' THEN 245.4
        WHEN p.note LIKE '%140.9 kilos%' THEN 140.9
        WHEN p.note LIKE '%215.6 kilos%' THEN 215.6
        WHEN p.note LIKE '%559.2 kilos%' THEN 559.2
        WHEN p.note LIKE '%676 kilos%' THEN 676.0
        WHEN p.note LIKE '%658 kilos%' THEN 658.0
        WHEN p.note LIKE '%553.8 kilos%' THEN 553.8
        WHEN p.note LIKE '%816 kilos%' THEN 816.0
        WHEN p.note LIKE '%1027.6 kilos%' THEN 1027.6
        WHEN p.note LIKE '%225.6 kilos%' THEN 225.6
        WHEN p.note LIKE '%383.7 kilos%' THEN 383.7
        WHEN p.note LIKE '%472.9 kilos%' THEN 472.9
        WHEN p.note LIKE '%521.7 kilos%' THEN 521.7
        WHEN p.note LIKE '%123.1 kilos%' THEN 123.1
        ELSE 0
    END as kilos,
    'Piece' as unit
FROM purchases p 
WHERE p.note LIKE '%pieces%' AND p.date >= '2025-08-01';

-- Verify the import
SELECT 
    p.reference,
    p.date,
    s.name as supplier_name,
    p.total_amount,
    pi.qty,
    pi.kilos,
    pi.cost
FROM purchases p
JOIN people s ON p.supplier = s.id
JOIN purchase_items pi ON p.id = pi.purchase_id
WHERE p.date >= '2025-08-01'
ORDER BY p.date DESC
LIMIT 10;
