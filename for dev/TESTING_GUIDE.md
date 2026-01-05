# Testing Franchisee Invoicing System

## Step-by-Step Testing Guide

### Prerequisites ✅
1. ✅ Database schema must be installed first
2. ✅ Have at least one franchisee with branches
3. ✅ Have some sales data linked to franchisees

---

## Phase 1: Database Setup

### 1. Install the Schema
Run this in your Supabase SQL Editor:

```sql
-- Copy and paste the entire content from:
-- for dev/franchisee_invoicing_schema.sql
```

### 2. Verify Tables Created
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'franchisee_%';

-- Expected results:
-- franchisee_invoices
-- franchisee_invoice_items
-- franchisee_invoice_payments
```

### 3. Verify Functions
```sql
-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%franchisee%';

-- Expected results:
-- generate_franchisee_invoice
-- get_franchisee_invoice_summary
-- update_franchisee_invoice_payment_status
```

---

## Phase 2: Test Data Preparation

### 1. Check Existing Franchisees
```sql
-- Get franchisees with their branches
SELECT 
    pb.id as people_branches_id,
    p.id as person_id,
    p.name as franchisee_name,
    b.id as branch_id,
    b.name as branch_name
FROM people_branches pb
JOIN people p ON pb.person_id = p.id
JOIN branches b ON pb.branch_id = b.id;
```

If you don't have franchisees yet:
```sql
-- Create a test franchisee
INSERT INTO people (name, type, email, phone, address)
VALUES ('Test Franchisee Inc.', 'customer', 'test@franchise.com', '0912-345-6789', 'Manila')
RETURNING id;

-- Create a test branch
INSERT INTO branches (name, code, address, city)
VALUES ('Branch 1 - Manila', 'BR001', 'Quezon City', 'Manila')
RETURNING id;

-- Link them
INSERT INTO people_branches (person_id, branch_id)
VALUES ('<person_id>', '<branch_id>')
RETURNING id;
```

### 2. Create Test Sales Data
```sql
-- Create a test sale for the franchisee
INSERT INTO sales (
    reference,
    date,
    warehouse,
    people_branches_id,
    status,
    payment_status,
    total_amount
) VALUES (
    'SAL-TEST-001',
    '2025-12-15'::DATE,
    (SELECT id FROM warehouses LIMIT 1),
    '<people_branches_id>',  -- Your franchisee's people_branches_id
    'delivered',
    'paid',
    50000.00
)
RETURNING id;

-- Add sale items
INSERT INTO sale_items (sale_id, product_id, price, qty)
SELECT 
    '<sale_id>',
    id,
    1000.00,
    50
FROM products 
LIMIT 1;
```

---

## Phase 3: UI Testing

### Test 1: View Invoices List
1. Navigate to: `http://localhost:5173/franchisee-invoices`
2. ✅ Should see empty list or existing invoices
3. ✅ Should see "Generate Invoice" button
4. ✅ Filters should work (franchisee, status, payment status)

### Test 2: Generate Invoice
1. Click "Generate Invoice" button
2. ✅ Should navigate to `/franchisee-invoices/generate`
3. Select a franchisee/branch from dropdown
4. ✅ Should populate with available franchisees
5. Set period dates (e.g., Dec 1-31, 2025)
6. Click "Preview Invoice"
7. ✅ Should show:
   - Number of sales found
   - Subtotal, discount, tax, total
   - Franchisee and branch details
8. Click "Generate Invoice"
9. ✅ Should create invoice and redirect to detail view

### Test 3: View Invoice Detail
1. Should auto-redirect after generation OR
2. Click on invoice from list
3. ✅ Should display:
   - Invoice header with number
   - Status badges
   - Franchisee information
   - Branch information
   - Billing period
   - List of invoice items (sales)
   - Totals breakdown
   - Balance due
4. ✅ Action buttons should show based on status

### Test 4: Record Payment
1. On invoice detail page, click "Record Payment"
2. ✅ Modal should open
3. Enter payment amount (less than or equal to balance)
4. Select payment date
5. Add notes (optional)
6. Click "Record Payment"
7. ✅ Should:
   - Close modal
   - Refresh invoice
   - Show updated balance
   - Show payment in payment history
   - Update payment status badge

### Test 5: Status Changes
1. On draft invoice, click "Mark as Sent"
2. ✅ Status should change to "Sent"
3. Click "Approve"
4. ✅ Status should change to "Approved"
5. ✅ Edit button should disappear (can't edit approved invoices)

### Test 6: Filters and Search
1. Go back to invoice list
2. Test franchisee filter
3. ✅ Should filter by selected franchisee
4. Test status filter
5. ✅ Should show only selected status
6. Test payment status filter
7. ✅ Should show only selected payment status

---

## Phase 4: API Testing

### Test via SQL Functions

#### 1. Generate Invoice via SQL
```sql
-- Generate an invoice for December 2025
SELECT generate_franchisee_invoice(
    '<people_branches_id>',  -- Your franchisee's ID
    '2025-12-01'::DATE,      -- Period start
    '2025-12-31'::DATE,      -- Period end
    30,                       -- Due in 30 days
    '<user_id>',             -- Creator user ID
    'Test invoice for December 2025'
) as invoice_id;
```

#### 2. Check Invoice Created
```sql
-- View the created invoice
SELECT * FROM v_franchisee_invoice_details
WHERE id = '<invoice_id_from_above>';
```

#### 3. Get Franchisee Summary
```sql
-- Get summary statistics
SELECT * FROM get_franchisee_invoice_summary('<franchisee_id>');

-- Should return:
-- total_invoices, total_amount, total_paid, total_outstanding, overdue_amount, overdue_count
```

#### 4. Record Payment via SQL
```sql
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
    1,  -- Your account ID
    'Partial payment'
)
RETURNING *;

-- Check payment status updated
SELECT invoice_number, payment_status, paid_amount, balance
FROM franchisee_invoices
WHERE id = '<invoice_id>';
```

---

## Phase 5: Edge Cases Testing

### Test 1: Invoice with No Sales
1. Generate invoice for a period with no sales
2. ✅ Should create invoice with 0 amount
3. ✅ Should show warning in preview

### Test 2: Overpayment
1. Try to record payment > balance
2. ✅ System should handle gracefully

### Test 3: Multiple Partial Payments
1. Record payment for 25% of total
2. ✅ Status should be "Partial"
3. Record another 25% payment
4. ✅ Status still "Partial"
5. Record final 50% payment
6. ✅ Status should change to "Paid"

### Test 4: Overdue Detection
1. Create invoice with past due date
2. ✅ Payment status should show "Overdue"
3. Record payment
4. ✅ Should change to "Paid"

### Test 5: Bulk Generation
```sql
-- Generate invoices for all franchisees
SELECT 
    person_id,
    generate_franchisee_invoice(
        id,
        '2025-01-01'::DATE,
        '2025-01-31'::DATE,
        30,
        '<admin_user_id>',
        'January 2026 monthly invoice'
    ) as invoice_id
FROM people_branches;
```

---

## Phase 6: Performance Testing

### Test Query Performance
```sql
-- Test index usage
EXPLAIN ANALYZE
SELECT * FROM v_franchisee_invoice_details
WHERE franchisee_id = '<franchisee_id>'
ORDER BY invoice_date DESC;

-- Should use indexes, not sequential scan
```

---

## Verification Checklist

### Database Layer ✓
- [ ] Tables created successfully
- [ ] Triggers working (invoice number generation)
- [ ] Constraints enforced (payment status, status)
- [ ] Foreign keys working
- [ ] Functions returning correct results
- [ ] Automatic payment status updates
- [ ] Account balance updates on payment

### Service Layer ✓
- [ ] TypeScript service imports without errors
- [ ] All methods accessible
- [ ] Error handling works
- [ ] Data validation works

### UI Layer ✓
- [ ] All pages load without errors
- [ ] Routes working
- [ ] Forms submitting correctly
- [ ] Filters working
- [ ] Modals opening/closing
- [ ] Data displaying correctly
- [ ] Status badges showing right colors
- [ ] Currency formatting correct (PHP)
- [ ] Date formatting correct

### Business Logic ✓
- [ ] Invoice generation pulls correct sales
- [ ] Totals calculated correctly
- [ ] Payment recording updates balance
- [ ] Status workflow enforced
- [ ] Overdue detection working
- [ ] Multiple payments accumulate correctly

---

## Common Issues & Solutions

### Issue 1: No franchisees showing
**Solution:** Ensure you have data in `people_branches` table

### Issue 2: No sales in invoice
**Solution:** Check that sales have `people_branches_id` set and are within the period

### Issue 3: Payment not updating balance
**Solution:** Check trigger is active:
```sql
SELECT tgname FROM pg_trigger WHERE tgname = 'trg_update_franchisee_invoice_payment_status';
```

### Issue 4: Invoice number not generating
**Solution:** Check reference_counters table:
```sql
SELECT * FROM reference_counters WHERE name = 'franchisee_invoices';
```

---

## Success Criteria

✅ All test cases pass
✅ No console errors
✅ Data persists correctly
✅ UI responsive and intuitive
✅ Calculations accurate
✅ Status workflows logical
✅ Reports show correct data

---

## Next Steps After Testing

1. **Add PDF Export** - Implement jsPDF functionality
2. **Email Notifications** - Set up Supabase Edge Functions
3. **Scheduled Jobs** - Auto-generate monthly invoices
4. **Custom Templates** - Add invoice design options
5. **Advanced Reports** - Build analytics dashboard

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs
3. Verify database schema installed
4. Check test data exists
5. Review [FRANCHISEE_INVOICING_GUIDE.md](FRANCHISEE_INVOICING_GUIDE.md)
