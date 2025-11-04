-- Fix product IDs for September 2025 sales
-- Change all CHICKEN (PRD-000001) sale_items to Marinated Chicken (PRD-000002)
-- This fixes the incorrect mapping where CHICKEN was mapped to PRD-000001 instead of PRD-000002

-- Update sale_items for September 2025 sales
UPDATE sale_items
SET product_id = '881bc12c-5d3d-449d-9006-dcd99a16312b'  -- Marinated Chicken PRD-000002
WHERE product_id = 'c2dd7582-b667-4039-be80-682e6eb71779'  -- CHICKEN PRD-000001
  AND sale_id IN (
    SELECT id FROM sales 
    WHERE date >= '2025-09-01' AND date <= '2025-09-30'
  );

-- Verify the update
SELECT 
    COUNT(*) as updated_items,
    (SELECT COUNT(*) FROM sale_items si 
     JOIN sales s ON si.sale_id = s.id 
     WHERE s.date >= '2025-09-01' AND s.date <= '2025-09-30'
     AND si.product_id = '881bc12c-5d3d-449d-9006-dcd99a16312b') as marinated_chicken_items,
    (SELECT COUNT(*) FROM sale_items si 
     JOIN sales s ON si.sale_id = s.id 
     WHERE s.date >= '2025-09-01' AND s.date <= '2025-09-30'
     AND si.product_id = 'c2dd7582-b667-4039-be80-682e6eb71779') as remaining_chicken_items
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
WHERE s.date >= '2025-09-01' AND s.date <= '2025-09-30';

