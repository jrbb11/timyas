# Franchisee Invoicing System - Implementation Guide

## Overview
Ang franchisee invoicing system ay para sa pag-billing sa mga franchisees base sa mga products na kinuha nila from the warehouse. Automated ang generation ng invoices from sales records.

## Business Model
- **Main Warehouse** releases products to franchisees
- Each release is recorded as a **SALE**
- At end of period, generate **INVOICE** for all products taken
- Franchisees pay based on payment terms (e.g., 30 days)

## Features Implemented

### 1. Database Schema (franchisee_invoicing_schema.sql)

#### Tables Created:
- **franchisee_invoices** - Main invoice table
  - Invoice number generation (FINV-YYYYMM-000001)
  - Period-based billing
  - Payment status tracking (unpaid, partial, paid, overdue)
  - Status workflow (draft → sent → approved)
  
- **franchisee_invoice_items** - Invoice line items
  - Links to actual sales transactions
  - Stores detailed breakdown per sale
  
- **franchisee_invoice_payments** - Payment records
  - Automatic account balance updates
  - Payment method tracking
  - Receipt management

#### Key Functions:
- `generate_franchisee_invoice()` - Auto-generates invoice from sales data
- `get_franchisee_invoice_summary()` - Summary statistics per franchisee
- `update_franchisee_invoice_payment_status()` - Auto-updates payment status
- `generate_franchisee_invoice_number()` - Auto-generates invoice numbers

#### View:
- `v_franchisee_invoice_details` - Complete invoice information with joins

### 2. Service Layer (franchiseeInvoicesService.ts)

Complete TypeScript service with methods for:
- Invoice CRUD operations
- Invoice generation (manual or automatic)
- Payment management
- Reporting and analytics
- Bulk operations

### 3. User Interface

#### Pages Created:

**a) FranchiseeInvoicesList.tsx**
- List all invoices with filters
- Filter by franchisee, status, payment status
- Summary cards showing totals
- Quick actions (view, edit)

**b) FranchiseeInvoiceGenerate.tsx**
- Select franchisee and branch
- Set billing period
- Preview before generating
- Shows sales count and totals

**c) FranchiseeInvoiceView.tsx**
- Professional invoice display
- Complete invoice details
- Payment history
- Record payments
- Status management
- Export to PDF (ready to implement)

## How to Use

### Installation Steps:

1. **Run the Database Schema**
   ```bash
   # Execute the SQL file in your Supabase/PostgreSQL
   psql -d your_database < for dev/franchisee_invoicing_schema.sql
   ```

2. **Access the UI**
   - Navigate to `/franchisee-invoices` to see all invoices
   - Click "Generate Invoice" button to create new invoice

### Generating Invoices:

**Option 1: Automatic Generation (Recommended)**
```typescript
// Generate invoice for a specific franchisee
await franchiseeInvoicesService.generateInvoice({
  people_branches_id: 'uuid-here',
  period_start: '2025-01-01',
  period_end: '2025-01-31',
  due_days: 30,
  created_by: 'user-uuid',
  notes: 'Monthly invoice for January'
});
```

**Option 2: Bulk Generation**
```typescript
// Generate invoices for ALL franchisees
await franchiseeInvoicesService.generateBulkInvoices(
  '2025-01-01',  // period start
  '2025-01-31',  // period end
  30,            // due days
  'user-uuid'    // created by
);
```

**Option 3: Via UI**
1. Go to `/franchisee-invoices/generate`
2. Select franchisee and branch
3. Choose billing period
4. Click "Preview Invoice"
5. Review and click "Generate Invoice"

### Recording Payments:

**Via UI:**
1. Open invoice detail page
2. Click "Record Payment" button
3. Enter amount, date, and notes
4. Submit

**Via Code:**
```typescript
await franchiseeInvoicesService.addPayment({
  invoice_id: 'invoice-uuid',
  amount: 50000,
  payment_date: '2025-01-15',
  account_id: 1,
  payment_method_id: 1,
  reference_number: 'REF-001',
  notes: 'Bank transfer'
});
```

### Invoice Workflow:

1. **Draft** - Newly created, can be edited
2. **Sent** - Sent to franchisee, locked from editing
3. **Approved** - Approved by admin, final
4. **Cancelled** - Voided invoice

### Payment Status:

- **Unpaid** - No payment received
- **Partial** - Some payment received, balance remaining
- **Paid** - Fully paid
- **Overdue** - Past due date with unpaid balance

## Integration Points

### With Existing System:

1. **Sales Module** - Invoices pull from sales table where `people_branches_id` matches
2. **Accounts Module** - Payments automatically update account balances
3. **Payment Methods** - Uses existing payment_methods table
4. **Branches** - Links to existing branches table
5. **People** - Links to existing people table (franchisees)

## Reporting Capabilities

### Available Reports:

```typescript
// Outstanding invoices
const { data } = await franchiseeInvoicesService.getOutstandingInvoices();

// Overdue invoices
const { data } = await franchiseeInvoicesService.getOverdueInvoices();

// Franchisee summary
const { data } = await franchiseeInvoicesService.getFranchiseeSummary(franchiseeId);

// Payment history
const { data } = await franchiseeInvoicesService.getPaymentHistory(
  franchiseeId,
  '2025-01-01',
  '2025-01-31'
);
```

## Future Enhancements

### Ready to Implement:

1. **PDF Export** - Function stub already in UI
   - Use libraries like jsPDF or pdfmake
   - Template already structured in FranchiseeInvoiceView

2. **Email Notifications**
   - Send invoice to franchisee email
   - Payment reminders for overdue
   - Payment confirmation receipts

3. **Recurring Invoices**
   - Set up automatic monthly/weekly invoicing
   - Scheduled jobs to generate invoices

4. **Invoice Templates**
   - Multiple invoice designs
   - Custom branding per franchisee

5. **Payment Plans**
   - Installment tracking
   - Auto-generate multiple invoices

6. **Analytics Dashboard**
   - Revenue by franchisee
   - Payment trends
   - Aging reports

## API Endpoints Reference

All operations use Supabase RPC or direct table operations:

```typescript
// Generate invoice
POST /rpc/generate_franchisee_invoice

// Get invoice summary
POST /rpc/get_franchisee_invoice_summary

// CRUD operations
GET    /franchisee_invoices
GET    /franchisee_invoices/:id
POST   /franchisee_invoices
PATCH  /franchisee_invoices/:id
DELETE /franchisee_invoices/:id

// Payments
POST   /franchisee_invoice_payments
GET    /franchisee_invoice_payments?invoice_id=eq.{id}
```

## Sample Usage Scenarios

### Scenario 1: Monthly Invoicing
```sql
-- Generate invoice for all franchisees for current month
SELECT generate_franchisee_invoice(
    pb.id,
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
    30,
    '<admin-user-id>',
    'Monthly invoice - ' || TO_CHAR(CURRENT_DATE, 'Month YYYY')
)
FROM people_branches pb;
```

### Scenario 2: Check Overdue Invoices
```sql
-- Get all overdue invoices
SELECT * FROM v_franchisee_invoice_details
WHERE payment_status = 'overdue'
ORDER BY days_overdue DESC;
```

### Scenario 3: Franchisee Account Summary
```sql
-- Get complete summary for a franchisee
SELECT * FROM get_franchisee_invoice_summary('<franchisee-id>');
```

## Troubleshooting

### Common Issues:

1. **No sales found for period**
   - Check that sales have `people_branches_id` set
   - Verify date range covers actual sales dates
   - Ensure sales status is not 'cancel'

2. **Payment not updating balance**
   - Check account_id exists in accounts table
   - Verify trigger is active: `trg_franchisee_invoice_payment_balance`
   - Check account balance permissions

3. **Invoice number not generating**
   - Ensure reference_counters table exists
   - Check trigger: `trg_generate_franchisee_invoice_number`

## Support & Maintenance

### Database Maintenance:

```sql
-- Rebuild indexes if performance degrades
REINDEX TABLE franchisee_invoices;
REINDEX TABLE franchisee_invoice_items;

-- Update statistics
ANALYZE franchisee_invoices;
ANALYZE franchisee_invoice_payments;
```

### Data Cleanup:

```sql
-- Archive old invoices (older than 2 years, fully paid)
-- Implement archiving strategy as needed
```

## Security Considerations

1. **Row Level Security (RLS)** - Add RLS policies based on your needs
2. **Audit Trail** - All operations logged via your existing audit system
3. **User Permissions** - Integrate with your RBAC system
4. **Data Encryption** - Supabase handles this automatically

## Performance Tips

1. Indexes already created on common query fields
2. Use materialized views for complex reports
3. Archive old invoices periodically
4. Consider partitioning for very large datasets

---

**Need Help?** Refer to the inline comments in the code for detailed explanations of each function and component.
