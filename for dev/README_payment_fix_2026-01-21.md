# Payment System Fix - 2026-01-21

## Problem Summary

Two critical issues were preventing proper payment recording in the franchisee invoice system:

1. **Constraint Error**: System couldn't record overpayments due to missing unique constraint
   - Error: `"Error recording payment: there is no unique or exclusion constraint matching the ON CONFLICT specification"`
   - Affected: All franchisees trying to record payments larger than invoice balance

2. **Incorrect Previous Balance**: Fully paid invoices were still showing arrears on next invoice
   - Example: Rea Ann De Luna's April invoice fully paid, but May invoice showed ₱10,650 arrears
   - Cause: Missing `balance > 0` check in previous_balance calculation

---

## Solutions Implemented

### 1. ✅ Fixed Constraint Error (GLOBAL - All Franchisees)

**File**: [`fix_payment_constraint_error.sql`](fix_payment_constraint_error.sql)

**What it does**:
- Adds unique partial index: `idx_franchisee_credits_unique_overpayment`
- Consolidates any existing duplicate overpayment credits
- Enables `ON CONFLICT` clause in trigger function to work properly

**Result**:
- ✅ All franchisees can now record overpayments without errors
- ✅ Overpayments automatically convert to credits
- ✅ No duplicate credit entries

**Status**: ✅ **DEPLOYED**

---

### 2. ✅ Fixed Previous Balance Calculation (GLOBAL - Future Invoices)

**File**: [`functions/generate_franchisee_invoice.sql`](functions/generate_franchisee_invoice.sql)

**What it does**:
- Added `AND balance > 0` check to previous_balance calculation
- Ensures only invoices with actual outstanding balance contribute to arrears

**Changes**:
```sql
-- Before:
WHERE payment_status IN ('unpaid', 'partial', 'overdue')
  AND status != 'cancelled';

-- After:
WHERE payment_status IN ('unpaid', 'partial', 'overdue')
  AND status != 'cancelled'
  AND balance > 0;  -- Extra safety check
```

**Result**:
- ✅ Future invoices will have accurate previous_balance
- ✅ Fully paid invoices won't show as arrears

**Status**: ✅ **DEPLOYED**

---

### 3. ✅ Fixed Rea Ann De Luna's Existing Data

**File**: [`investigate_previous_balance_issue.sql`](investigate_previous_balance_issue.sql)

**What it does**:
- Queries Rea Ann De Luna's invoices
- Recalculates all invoice balances
- Fixes May 2025 invoice's previous_balance from ₱10,650 to ₱0

**Result**:
- ✅ April invoice: Balance = ₱0, Status = PAID
- ✅ May invoice: Previous Balance = ₱0 (was ₱10,650)

**Status**: ✅ **DEPLOYED** (Rea Ann De Luna only)

---

### 4. 🆕 Fix All Franchisees (OPTIONAL)

**File**: [`fix_all_franchisees_balances.sql`](fix_all_franchisees_balances.sql)

**What it does**:
- Recalculates ALL invoice balances for EVERY franchisee
- Fixes previous_balance for ALL invoices system-wide
- Shows summary statistics

**When to use**:
- If you want to ensure entire system is clean
- If other franchisees have similar balance issues
- For peace of mind that everything is correct

**Status**: ⚠️ **OPTIONAL** - Not yet run (only Rea Ann De Luna was fixed)

---

## Files Created/Modified

### New Files Created:
1. ✅ [`fix_payment_constraint_error.sql`](fix_payment_constraint_error.sql) - Main migration for constraint
2. ✅ [`investigate_previous_balance_issue.sql`](investigate_previous_balance_issue.sql) - Fix specific franchisee
3. 🆕 [`fix_all_franchisees_balances.sql`](fix_all_franchisees_balances.sql) - Fix all franchisees
4. 📋 [`DEPLOYMENT_GUIDE_payment_fix.sql`](DEPLOYMENT_GUIDE_payment_fix.sql) - Step-by-step guide
5. 📋 [`test_payment_fix.sql`](test_payment_fix.sql) - Test suite
6. 📄 **`README_payment_fix_2026-01-21.md`** - This file

### Modified Files:
1. ✅ [`functions/generate_franchisee_invoice.sql`](functions/generate_franchisee_invoice.sql) - Added balance check

---

## Deployment Status

| Step | File | Status | Description |
|------|------|--------|-------------|
| ✅ 1 | `fix_payment_constraint_error.sql` | **DEPLOYED** | Added unique constraint |
| ✅ 2 | `functions/generate_franchisee_invoice.sql` | **DEPLOYED** | Updated function |
| ✅ 3 | `investigate_previous_balance_issue.sql` | **DEPLOYED** | Fixed Rea Ann De Luna |
| ⚠️ 4 | `fix_all_franchisees_balances.sql` | **OPTIONAL** | Fix all franchisees |

---

## What's Fixed

### ✅ **For ALL Franchisees (Immediate Effect)**

1. **Payment Recording**: Can record any amount, including overpayments
2. **Overpayment Credits**: Automatically created and applied
3. **Future Invoices**: Accurate previous_balance calculation
4. **No Duplicates**: Unique constraint prevents duplicate credits

### ✅ **For Rea Ann De Luna (Specific Fix)**

1. **April Invoice**: Balance = ₱0, Status = PAID ✅
2. **May Invoice**: Previous Balance = ₱0 (was ₱10,650) ✅
3. **Ready for Payment**: Can record ₱20,000 payment without errors ✅

### ⚠️ **Pending (If Needed)**

1. **Other Franchisees**: Run `fix_all_franchisees_balances.sql` if they have similar issues

---

## How to Test

### Test 1: Record Overpayment (Rea Ann De Luna)

1. Go to Rea Ann De Luna's May 2025 invoice
2. Record payment of ₱150,000 (larger than ₱120,110 balance)
3. Expected:
   - ✅ No error
   - ✅ Invoice balance = ₱0
   - ✅ Overpayment credit created = ₱29,890
   - ✅ Credit auto-applies to future invoices

### Test 2: Verify Previous Balance

1. Generate a new invoice for Rea Ann De Luna
2. Expected:
   - ✅ Previous Balance = ₱0 (not showing paid invoices)

### Test 3: Run Test Suite

```sql
\i test_payment_fix.sql
```

Expected: All tests should **PASS** ✅

---

## Database Changes Summary

### New Index:
```sql
CREATE UNIQUE INDEX idx_franchisee_credits_unique_overpayment
ON public.franchisee_credits (source_invoice_id)
WHERE source_type = 'overpayment' AND source_invoice_id IS NOT NULL;
```

### Updated Functions:
- `generate_franchisee_invoice()` - Added `balance > 0` check

### Trigger Functions (No Changes):
- `update_franchisee_invoice_payment_status()` - Already correct, just needed constraint

---

## Rollback Plan

If something goes wrong:

### Option 1: Restore from Backup
```bash
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE < backup_before_payment_fix.sql
```

### Option 2: Remove Constraint Only
```sql
DROP INDEX IF EXISTS idx_franchisee_credits_unique_overpayment;
```

---

## Next Steps (Optional)

1. **Fix All Franchisees**: Run `fix_all_franchisees_balances.sql` if needed
2. **Monitor**: Watch for any payment recording issues
3. **Test**: Try recording overpayments for other franchisees
4. **Document**: Update user guide with new overpayment feature

---

## Technical Details

### Root Cause - Constraint Error

The trigger function `update_franchisee_invoice_payment_status()` uses:
```sql
INSERT INTO franchisee_credits (...) VALUES (...)
ON CONFLICT (source_invoice_id) WHERE source_type = 'overpayment'
DO UPDATE SET ...
```

But no matching unique constraint existed. PostgreSQL requires an exact match for `ON CONFLICT` clauses.

### Root Cause - Previous Balance

The query was missing explicit `balance > 0` check:
```sql
SELECT SUM(balance)
FROM franchisee_invoices
WHERE payment_status IN ('unpaid', 'partial', 'overdue')
  AND status != 'cancelled'
  -- Missing: AND balance > 0
```

This could include invoices transitioning to 'paid' status but with stale balance values.

---

## Success Metrics

- ✅ Zero constraint errors when recording payments
- ✅ Overpayments successfully create credits
- ✅ Previous balance only shows unpaid invoices
- ✅ Rea Ann De Luna's invoices corrected
- ✅ System ready for production use

---

## Contact & Support

If you encounter any issues:
1. Check the deployment guide: `DEPLOYMENT_GUIDE_payment_fix.sql`
2. Run the test suite: `test_payment_fix.sql`
3. Review this README for troubleshooting

---

**Last Updated**: 2026-01-21 23:18  
**Deployed By**: Admin  
**Status**: ✅ Production Ready
