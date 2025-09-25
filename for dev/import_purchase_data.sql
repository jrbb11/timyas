-- Import Purchase Data from Google Sheets
-- This script imports all 38 purchase records with existing supplier IDs

-- First, let's get the CHICKEN product ID (assuming it's PRD-000001)
-- We'll use this for all purchase items since they're all CHICKEN

-- Insert all purchases
INSERT INTO purchases (date, supplier, warehouse, status, payment_status, total_amount, note) VALUES
('2025-06-13', '9ff442a0-3100-4e0e-b974-71287ecfe587', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 110694.00, 'Art Fresh Chicken Corp. - 510 pieces, 582.6 kilos'),
('2025-06-17', '9ff442a0-3100-4e0e-b974-71287ecfe587', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 154898.80, 'Art Fresh Chicken Corp. - 750 pieces, 790.3 kilos'),
('2025-06-17', '9ff442a0-3100-4e0e-b974-71287ecfe587', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 118826.00, 'Art Fresh Chicken Corp. - 660 pieces, 625.4 kilos'),
('2025-06-18', '9ff442a0-3100-4e0e-b974-71287ecfe587', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 153546.40, 'Art Fresh Chicken Corp. - 750 pieces, 783.4 kilos'),
('2025-06-30', 'fb7bb098-20d2-4d87-919c-d5977c04b816', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 81325.00, 'Athena Dred - 390 pieces, 439.6 kilos'),
('2025-06-02', '2288a3c7-e0b0-42d9-99d3-3c9794ac94d4', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 182596.80, 'Benben Dressed chicken - 866 pieces, 1002.2 kilos'),
('2025-06-04', '6cd63ad0-5061-49ed-9191-81c2bcabd80d', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 218371.20, 'Luzviminda Dressed chicken - 1050 pieces, 1186.8 kilos'),
('2025-06-05', '6cd63ad0-5061-49ed-9191-81c2bcabd80d', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 185854.80, 'Luzviminda Dressed chicken - 900 pieces, 1015.6 kilos'),
('2025-06-15', '6cd63ad0-5061-49ed-9191-81c2bcabd80d', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 189052.50, 'Luzviminda Dressed chicken - 900 pieces, 969.5 kilos'),
('2025-06-15', '6cd63ad0-5061-49ed-9191-81c2bcabd80d', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 130022.40, 'Luzviminda Dressed chicken - 600 pieces, 677.2 kilos'),
('2025-06-24', '6cd63ad0-5061-49ed-9191-81c2bcabd80d', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 324345.00, 'Luzviminda Dressed chicken - 1484 pieces, 1622.8 kilos'),
('2025-06-03', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 46547.00, 'PMC Dressed Chicken - 230 pieces, 261.5 kilos'),
('2025-06-04', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 40708.60, 'PMC Dressed Chicken - 200 pieces, 228.7 kilos'),
('2025-06-05', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 61245.00, 'PMC Dressed Chicken - 300 pieces, 340.25 kilos'),
('2025-06-05', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 70596.00, 'PMC Dressed Chicken - 339 pieces, 392.2 kilos'),
('2025-06-07', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 102173.40, 'PMC Dressed Chicken - 497 pieces, 571.03 kilos'),
('2025-06-07', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 102348.00, 'PMC Dressed Chicken - 500 pieces, 568.6 kilos'),
('2025-06-09', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 75870.00, 'PMC Dressed Chicken - 366 pieces, 426.1 kilos'),
('2025-06-10', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 60552.00, 'PMC Dressed Chicken - 300 pieces, 336.4 kilos'),
('2025-06-10', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 100782.00, 'PMC Dressed Chicken - 490 pieces, 559.9 kilos'),
('2025-06-11', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 110448.00, 'PMC Dressed Chicken - 540 pieces, 613.6 kilos'),
('2025-06-16', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 60518.10, 'PMC Dressed Chicken - 290 pieces, 330.7 kilos'),
('2025-06-17', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 64745.40, 'PMC Dressed Chicken - 310 pieces, 353.8 kilos'),
('2025-06-18', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 35448.93, 'PMC Dressed Chicken - 170 pieces, 193.71 kilos'),
('2025-06-19', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 74773.80, 'PMC Dressed Chicken - 360 pieces, 408.6 kilos'),
('2025-06-19', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 34557.72, 'PMC Dressed Chicken - 165 pieces, 194.34 kilos'),
('2025-06-20', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 44504.39, 'PMC Dressed Chicken - 219 pieces, 244.33 kilos'),
('2025-06-20', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 54607.20, 'PMC Dressed Chicken - 260 pieces, 298.4 kilos'),
('2025-06-21', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 61289.00, 'PMC Dressed Chicken - 290 pieces, 331.3 kilos'),
('2025-06-21', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 51516.95, 'PMC Dressed Chicken - 260 pieces, 278.47 kilos'),
('2025-06-23', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 90354.00, 'PMC Dressed Chicken - 430 pieces, 488.4 kilos'),
('2025-06-23', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 48518.10, 'PMC Dressed Chicken - 240 pieces, 262.26 kilos'),
('2025-06-24', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 123557.00, 'PMC Dressed Chicken - 600 pieces, 650.3 kilos'),
('2025-06-25', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 25878.00, 'PMC Dressed Chicken - 120 pieces, 136.2 kilos'),
('2025-06-26', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 47367.00, 'PMC Dressed Chicken - 220 pieces, 249.3 kilos'),
('2025-06-27', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 70980.00, 'PMC Dressed Chicken - 320 pieces, 364 kilos'),
('2025-06-28', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 137590.00, 'PMC Dressed Chicken - 620 pieces, 705.6 kilos'),
('2025-06-30', 'c424f891-e609-4a26-a28c-a5d5a2e4cc19', 'e7e5a4a0-bb8c-4f99-b27a-3c0559f7c9cb', 'received', 'pending', 140398.00, 'PMC Dressed Chicken - 630 pieces, 720 kilos');

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
        WHEN p.note LIKE '%510 pieces%' THEN 110694.00 / 510
        WHEN p.note LIKE '%750 pieces%' THEN 
            CASE 
                WHEN p.total_amount = 154898.80 THEN 154898.80 / 750
                WHEN p.total_amount = 153546.40 THEN 153546.40 / 750
                ELSE 190.00
            END
        WHEN p.note LIKE '%660 pieces%' THEN 118826.00 / 660
        WHEN p.note LIKE '%390 pieces%' THEN 81325.00 / 390
        WHEN p.note LIKE '%866 pieces%' THEN 182596.80 / 866
        WHEN p.note LIKE '%1050 pieces%' THEN 218371.20 / 1050
        WHEN p.note LIKE '%900 pieces%' THEN 
            CASE 
                WHEN p.total_amount = 185854.80 THEN 185854.80 / 900
                WHEN p.total_amount = 189052.50 THEN 189052.50 / 900
                ELSE 190.00
            END
        WHEN p.note LIKE '%600 pieces%' THEN 130022.40 / 600
        WHEN p.note LIKE '%1484 pieces%' THEN 324345.00 / 1484
        WHEN p.note LIKE '%230 pieces%' THEN 46547.00 / 230
        WHEN p.note LIKE '%200 pieces%' THEN 40708.60 / 200
        WHEN p.note LIKE '%300 pieces%' THEN 
            CASE 
                WHEN p.total_amount = 61245.00 THEN 61245.00 / 300
                WHEN p.total_amount = 60552.00 THEN 60552.00 / 300
                ELSE 190.00
            END
        WHEN p.note LIKE '%339 pieces%' THEN 70596.00 / 339
        WHEN p.note LIKE '%497 pieces%' THEN 102173.40 / 497
        WHEN p.note LIKE '%500 pieces%' THEN 102348.00 / 500
        WHEN p.note LIKE '%366 pieces%' THEN 75870.00 / 366
        WHEN p.note LIKE '%490 pieces%' THEN 100782.00 / 490
        WHEN p.note LIKE '%540 pieces%' THEN 110448.00 / 540
        WHEN p.note LIKE '%290 pieces%' THEN 60518.10 / 290
        WHEN p.note LIKE '%310 pieces%' THEN 64745.40 / 310
        WHEN p.note LIKE '%170 pieces%' THEN 35448.93 / 170
        WHEN p.note LIKE '%360 pieces%' THEN 74773.80 / 360
        WHEN p.note LIKE '%165 pieces%' THEN 34557.72 / 165
        WHEN p.note LIKE '%219 pieces%' THEN 44504.39 / 219
        WHEN p.note LIKE '%260 pieces%' THEN 
            CASE 
                WHEN p.total_amount = 54607.20 THEN 54607.20 / 260
                WHEN p.total_amount = 51516.95 THEN 51516.95 / 260
                ELSE 190.00
            END
        WHEN p.note LIKE '%430 pieces%' THEN 90354.00 / 430
        WHEN p.note LIKE '%240 pieces%' THEN 48518.10 / 240
        WHEN p.note LIKE '%120 pieces%' THEN 25878.00 / 120
        WHEN p.note LIKE '%220 pieces%' THEN 47367.00 / 220
        WHEN p.note LIKE '%320 pieces%' THEN 70980.00 / 320
        WHEN p.note LIKE '%620 pieces%' THEN 137590.00 / 620
        WHEN p.note LIKE '%630 pieces%' THEN 140398.00 / 630
        ELSE 190.00
    END as cost,
    CASE 
        WHEN p.note LIKE '%510 pieces%' THEN 510
        WHEN p.note LIKE '%750 pieces%' THEN 750
        WHEN p.note LIKE '%660 pieces%' THEN 660
        WHEN p.note LIKE '%390 pieces%' THEN 390
        WHEN p.note LIKE '%866 pieces%' THEN 866
        WHEN p.note LIKE '%1050 pieces%' THEN 1050
        WHEN p.note LIKE '%900 pieces%' THEN 900
        WHEN p.note LIKE '%600 pieces%' THEN 600
        WHEN p.note LIKE '%1484 pieces%' THEN 1484
        WHEN p.note LIKE '%230 pieces%' THEN 230
        WHEN p.note LIKE '%200 pieces%' THEN 200
        WHEN p.note LIKE '%300 pieces%' THEN 300
        WHEN p.note LIKE '%339 pieces%' THEN 339
        WHEN p.note LIKE '%497 pieces%' THEN 497
        WHEN p.note LIKE '%500 pieces%' THEN 500
        WHEN p.note LIKE '%366 pieces%' THEN 366
        WHEN p.note LIKE '%490 pieces%' THEN 490
        WHEN p.note LIKE '%540 pieces%' THEN 540
        WHEN p.note LIKE '%290 pieces%' THEN 290
        WHEN p.note LIKE '%310 pieces%' THEN 310
        WHEN p.note LIKE '%170 pieces%' THEN 170
        WHEN p.note LIKE '%360 pieces%' THEN 360
        WHEN p.note LIKE '%165 pieces%' THEN 165
        WHEN p.note LIKE '%219 pieces%' THEN 219
        WHEN p.note LIKE '%260 pieces%' THEN 260
        WHEN p.note LIKE '%430 pieces%' THEN 430
        WHEN p.note LIKE '%240 pieces%' THEN 240
        WHEN p.note LIKE '%120 pieces%' THEN 120
        WHEN p.note LIKE '%220 pieces%' THEN 220
        WHEN p.note LIKE '%320 pieces%' THEN 320
        WHEN p.note LIKE '%620 pieces%' THEN 620
        WHEN p.note LIKE '%630 pieces%' THEN 630
        ELSE 1
    END as qty,
    CASE 
        WHEN p.note LIKE '%582.6 kilos%' THEN 582.6
        WHEN p.note LIKE '%790.3 kilos%' THEN 790.3
        WHEN p.note LIKE '%625.4 kilos%' THEN 625.4
        WHEN p.note LIKE '%783.4 kilos%' THEN 783.4
        WHEN p.note LIKE '%439.6 kilos%' THEN 439.6
        WHEN p.note LIKE '%1002.2 kilos%' THEN 1002.2
        WHEN p.note LIKE '%1186.8 kilos%' THEN 1186.8
        WHEN p.note LIKE '%1015.6 kilos%' THEN 1015.6
        WHEN p.note LIKE '%969.5 kilos%' THEN 969.5
        WHEN p.note LIKE '%677.2 kilos%' THEN 677.2
        WHEN p.note LIKE '%1622.8 kilos%' THEN 1622.8
        WHEN p.note LIKE '%261.5 kilos%' THEN 261.5
        WHEN p.note LIKE '%228.7 kilos%' THEN 228.7
        WHEN p.note LIKE '%340.25 kilos%' THEN 340.25
        WHEN p.note LIKE '%392.2 kilos%' THEN 392.2
        WHEN p.note LIKE '%571.03 kilos%' THEN 571.03
        WHEN p.note LIKE '%568.6 kilos%' THEN 568.6
        WHEN p.note LIKE '%426.1 kilos%' THEN 426.1
        WHEN p.note LIKE '%336.4 kilos%' THEN 336.4
        WHEN p.note LIKE '%559.9 kilos%' THEN 559.9
        WHEN p.note LIKE '%613.6 kilos%' THEN 613.6
        WHEN p.note LIKE '%330.7 kilos%' THEN 330.7
        WHEN p.note LIKE '%353.8 kilos%' THEN 353.8
        WHEN p.note LIKE '%193.71 kilos%' THEN 193.71
        WHEN p.note LIKE '%408.6 kilos%' THEN 408.6
        WHEN p.note LIKE '%194.34 kilos%' THEN 194.34
        WHEN p.note LIKE '%244.33 kilos%' THEN 244.33
        WHEN p.note LIKE '%298.4 kilos%' THEN 298.4
        WHEN p.note LIKE '%331.3 kilos%' THEN 331.3
        WHEN p.note LIKE '%278.47 kilos%' THEN 278.47
        WHEN p.note LIKE '%488.4 kilos%' THEN 488.4
        WHEN p.note LIKE '%262.26 kilos%' THEN 262.26
        WHEN p.note LIKE '%650.3 kilos%' THEN 650.3
        WHEN p.note LIKE '%136.2 kilos%' THEN 136.2
        WHEN p.note LIKE '%249.3 kilos%' THEN 249.3
        WHEN p.note LIKE '%364 kilos%' THEN 364.0
        WHEN p.note LIKE '%705.6 kilos%' THEN 705.6
        WHEN p.note LIKE '%720 kilos%' THEN 720.0
        ELSE 0
    END as kilos,
    'Piece' as unit
FROM purchases p 
WHERE p.note LIKE '%pieces%';

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
ORDER BY p.date DESC
LIMIT 10;
