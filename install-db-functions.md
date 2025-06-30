# Database Functions Installation Guide

## Issue
The "Failed to create adjustment batch" error is occurring because the required database functions are not installed in your Supabase database.

## Solution
You need to run the SQL functions from `for dev/missing_functions.sql` in your Supabase database.

## Steps to Install

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `for dev/missing_functions.sql`
4. Paste and execute the SQL

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push --include-all
```

### Option 3: Using psql (if you have direct database access)
```bash
psql "your-supabase-connection-string" -f "for dev/missing_functions.sql"
```

## Required Functions
The following functions need to be installed:
- `generate_reference_for_table()` - Generates reference codes for tables
- `handle_purchase_stock()` - Handles stock updates on purchases
- `fn_ws_on_sale_items()` - Handles stock updates on sales
- `fn_apply_adjustment_stock()` - Handles stock updates on adjustments
- `updated_at_timestamp()` - Updates timestamps on record changes
- Various balance update functions for payments

## Verification
After installing the functions, you should be able to:
1. Create stock adjustments without errors
2. See auto-generated reference codes (ADJ-000001, etc.)
3. Have stock levels automatically updated

## Troubleshooting
If you still get errors after installing the functions:
1. Check the browser console for detailed error messages
2. Verify that the `reference_counters` table exists
3. Ensure all triggers are properly created
4. Check that the functions have the correct permissions 