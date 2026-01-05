# 📘 User Manual: Franchisee Payment & Invoice System

## For: Franchisee Business Users

---

## 🎯 Overview

Ang sistema na ito ay ginagamit para sa:
1. **Pag-generate ng Invoice** - Automatic na invoice based sa products na kinuha ng franchisee
2. **Payment Recording** - Pag-record ng mga bayad mula sa franchisees  
3. **Tracking ng Balance** - Real-time tracking ng utang at bayad

---

## 📋 Table of Contents

1. [Viewing Invoices](#1-viewing-invoices)
2. [Generating New Invoice](#2-generating-new-invoice)
3. [Recording Payments](#3-recording-payments)
4. [Checking Invoice Details](#4-checking-invoice-details)
5. [Invoice Status Guide](#5-invoice-status-guide)
6. [Payment Status Guide](#6-payment-status-guide)
7. [Common Questions](#7-common-questions)

---

## 1. Viewing Invoices

### Step-by-Step:

1. **Login** to the system
2. Click **"Franchisee Invoices"** sa sidebar menu
3. Makikita mo lahat ng invoices with details:
   - Invoice Number (ex: FINV-202601-000001)
   - Franchisee Name
   - Branch
   - Invoice Date & Due Date
   - Total Amount
   - Balance (kung may utang pa)
   - Status

### Using Filters:

**Filter by Franchisee:**
- Click dropdown sa **"Franchisee"**
- Select franchisee name
- List will update automatically

**Filter by Status:**
- **All Statuses** - Show all
- **Draft** - Hindi pa final
- **Sent** - Sent na sa franchisee
- **Approved** - Approved na ng admin
- **Cancelled** - Cancelled invoices

**Filter by Payment Status:**
- **All Payment Statuses** - Show all
- **Unpaid** - Walang bayad pa
- **Partial** - May bayad na pero kulang pa
- **Paid** - Fully paid na
- **Overdue** - Lagpas na sa due date

### Summary Cards:

Sa bottom ng page makikita mo:
- **Total Invoices** - Ilan lahat
- **Total Amount** - Total ng lahat ng invoices
- **Total Paid** - Total ng nabayaran na
- **Outstanding** - Total ng utang pa

---

## 2. Generating New Invoice

### When to Generate:

Generate invoice **at the end of billing period** (usually monthly or weekly based sa arrangement).

### Step-by-Step:

1. Click **"Generate Invoice"** button (top right)

2. **Select Franchisee & Branch**
   - Choose from dropdown
   - Format: "Franchisee Name - Branch Name"
   - ⚠️ Make sure tama ang pipiliin!

3. **Set Billing Period**
   - **Period Start**: First day ng period (ex: January 1, 2025)
   - **Period End**: Last day ng period (ex: January 31, 2025)
   - 💡 Tip: Default is current month

4. **Set Payment Terms**
   - **Payment Due (days)**: Ilang days before due date
   - Default is 30 days
   - Example: Invoice date is Jan 1, due date will be Jan 31

5. **Add Notes** (Optional)
   - Special instructions
   - Payment reminders
   - Custom notes for franchisee

6. **Preview Invoice**
   - Click **"Preview Invoice"** button
   - System will show:
     - Franchisee & branch details
     - Billing period
     - Number of sales/transactions
     - Total amount breakdown:
       - Subtotal
       - Discount
       - Tax
       - **Total**

7. **Generate**
   - Review preview carefully
   - If tama, click **"Generate Invoice"**
   - System will:
     - Create invoice with unique number
     - Link all sales for the period
     - Calculate totals automatically
     - Redirect to invoice detail page

### ⚠️ Important Notes:

- **Invoice pulls from SALES records** - Make sure sales are recorded correctly first
- **Cannot edit after approval** - Double check before approving
- **Invoice number is auto-generated** - Format: FINV-YYYYMM-######

---

## 3. Recording Payments

### When Payment is Received:

Whenever franchisee pays (cash, bank transfer, check), record it immediately.

### Step-by-Step:

1. **Open Invoice**
   - Go to Franchisee Invoices list
   - Click on invoice number

2. **Click "Record Payment" Button**
   - Green button sa top right
   - Modal will open

3. **Fill in Payment Details**
   
   **Amount** (Required)
   - Enter exact amount received
   - Maximum: Current balance
   - Can be full or partial payment
   
   **Payment Date** (Required)
   - Date when payment was received
   - Default: Today's date
   
   **Notes** (Optional)
   - Payment method (ex: "Bank transfer")
   - Reference number (ex: "BPI Ref: 123456")
   - Check number
   - Any remarks

4. **Submit**
   - Click **"Record Payment"** button
   - System will automatically:
     - Update balance
     - Update payment status
     - Add to payment history
     - Update account balance

### Multiple Payments:

Pwedeng mag-record ng **multiple partial payments**:

Example:
- Invoice Total: ₱50,000
- Payment 1: ₱20,000 (Jan 15) → Status: **Partial**
- Payment 2: ₱15,000 (Jan 20) → Status: **Partial**  
- Payment 3: ₱15,000 (Jan 25) → Status: **Paid**

### Payment History:

All payments are tracked:
- Date of payment
- Amount
- Payment method
- Reference number
- Who recorded it
- Notes

---

## 4. Checking Invoice Details

### Invoice Detail Page Shows:

**Header Section:**
- Invoice Number
- Invoice Date
- Due Date
- Status badge (Draft/Sent/Approved/Cancelled)
- Payment Status badge (Unpaid/Partial/Paid/Overdue)

**Bill To Information:**
- Franchisee name
- Contact details (email, phone)
- Address

**Branch Information:**
- Branch name
- Branch code
- Address

**Billing Period:**
- Period start date
- Period end date

**Invoice Items (Sales List):**
- Description (Sale reference with item count)
- Sale Date
- Quantity
- Unit Price
- Discount
- Tax
- Line Total

**Totals Section:**
- **Subtotal**: Before tax and discount
- **Discount**: Total discounts
- **Tax**: Total tax
- **TOTAL**: Final amount
- **Paid**: Amount received
- **BALANCE DUE**: Remaining balance (highlighted)

**Payment History:**
- All payments received
- Dates, amounts, methods
- Running balance

**Actions Available:**
- Record Payment (if not fully paid)
- Export PDF (for printing/emailing)
- Mark as Sent
- Approve
- Cancel (if needed)

---

## 5. Invoice Status Guide

### Draft 🟡
- **Meaning**: Newly created, can still edit
- **Actions**: Can edit, delete, or approve
- **Who sees it**: Admin/Accounting staff only

### Sent 🔵  
- **Meaning**: Sent to franchisee, locked from editing
- **Actions**: Can approve or cancel only
- **Who sees it**: Franchisee and admin

### Approved ✅
- **Meaning**: Final, approved by admin
- **Actions**: Cannot edit, can only record payments
- **Who sees it**: Everyone

### Cancelled ❌
- **Meaning**: Voided/invalid invoice
- **Actions**: No actions available
- **Who sees it**: Everyone (for record only)

---

## 6. Payment Status Guide

### Unpaid 🟡
- **Meaning**: No payment received yet
- **Balance**: 100% of total
- **Action**: Record payment when received

### Partial 🟠
- **Meaning**: Some payment received, but not complete
- **Balance**: Remaining amount
- **Action**: Continue recording payments until paid

### Paid ✅
- **Meaning**: Fully paid
- **Balance**: ₱0.00
- **Action**: None, invoice is closed

### Overdue 🔴
- **Meaning**: Past due date and still unpaid/partial
- **Balance**: Outstanding amount
- **Action**: Follow up with franchisee + record payment

---

## 7. Common Questions

### Q1: Paano kung may error sa invoice?

**A:** Depende sa status:
- **If Draft**: Edit or delete, then recreate
- **If Sent/Approved**: Cannot edit. Options:
  - Cancel and create new invoice
  - Create adjustment invoice (debit/credit note)
  - Contact admin for manual correction

### Q2: Pwede bang i-delete ang invoice?

**A:** 
- **Draft**: Yes, can delete
- **Sent/Approved**: No, can only CANCEL
- **With Payments**: Cannot delete, can only cancel

### Q3: Paano kung sobra ang binayad?

**A:**
- System allows overpayment
- Balance will show negative
- Can issue refund or apply to next invoice
- Contact accounting for adjustment

### Q4: Ano ang gagawin kung overdue na?

**A:**
1. Check payment status
2. Contact franchisee for follow-up
3. Send payment reminder (email/SMS)
4. Record payment when received
5. System auto-updates from overdue to paid

### Q5: Pwede bang i-edit ang payment?

**A:**
- **No**, cannot edit recorded payment
- If error, need to:
  1. Delete wrong payment
  2. Record correct payment
- ⚠️ Only admin can delete payments

### Q6: Paano kung walang sales for the period?

**A:**
- System will still create invoice
- Amount will be ₱0.00
- Warning will show in preview
- Can proceed if needed (placeholder invoice)

### Q7: Ano ang ibig sabihin ng Invoice Number?

**A:** Format: **FINV-YYYYMM-######**
- **FINV**: Franchisee Invoice
- **YYYYMM**: Year and month (202601 = January 2025)
- **######**: Sequential number (000001, 000002, etc.)

### Q8: Saan papunta ang payments?

**A:**
- Payments are recorded in system
- Automatically updates account balance
- Can be tracked in Accounts module
- Can generate reports for reconciliation

### Q9: Pwede bang mag-export ng invoice?

**A:**
- **Yes**, click "Export PDF" button
- Will generate printable PDF
- Can email to franchisee
- Can print for records

### Q10: Paano mag-generate ng bulk invoices?

**A:**
Currently, one-by-one ang generation. For bulk:
1. Contact IT/Admin
2. They can run SQL script to generate all
3. Or use "Generate All" feature (if available)

---

## 📞 Support

### Need Help?

**For Technical Issues:**
- Check browser console for errors (F12)
- Clear browser cache
- Try different browser
- Contact IT support

**For Business Questions:**
- Contact Accounting Department
- Review Franchisee Agreement
- Check payment terms

**For System Errors:**
- Take screenshot of error
- Note down what you were doing
- Contact system administrator

---

## 🎓 Best Practices

### DO ✅

1. **Generate invoices on time** - At end of each period
2. **Record payments immediately** - When received
3. **Double-check amounts** - Before finalizing
4. **Add notes** - For future reference
5. **Follow up overdue** - Regularly check and remind
6. **Keep records** - Export and archive PDFs
7. **Reconcile regularly** - Match with bank statements

### DON'T ❌

1. **Don't delay recording** - Record ASAP
2. **Don't forget notes** - Always add payment details
3. **Don't approve without review** - Check carefully
4. **Don't delete with payments** - Can only cancel
5. **Don't record wrong amounts** - Verify first
6. **Don't skip reconciliation** - Match regularly

---

## 📊 Reports You Can Generate

1. **Outstanding Invoices** - All unpaid/partial invoices
2. **Overdue Report** - Past due invoices
3. **Payment History** - All payments by period
4. **Franchisee Summary** - Total invoices, paid, outstanding per franchisee
5. **Aging Report** - How long invoices are outstanding
6. **Revenue Report** - Total invoiced vs paid

---

## 🔐 Security & Access

### Who Can:

**Generate Invoices:**
- Accounting staff
- Admin
- Authorized users with "financial:create" permission

**Record Payments:**
- Accounting staff
- Admin
- Cashier (if authorized)

**View Invoices:**
- Franchisees (their own only)
- Accounting staff (all)
- Admin (all)

**Approve Invoices:**
- Admin
- Accounting Manager

**Cancel/Delete:**
- Admin only

---

## 📝 Workflow Summary

```
1. SALES RECORDED
   ↓
2. END OF PERIOD → GENERATE INVOICE
   ↓
3. PREVIEW & REVIEW
   ↓
4. GENERATE → Invoice created (Draft)
   ↓
5. APPROVE → Invoice final (Approved)
   ↓
6. SEND TO FRANCHISEE → Status: Sent
   ↓
7. FRANCHISEE PAYS → Record Payment
   ↓
8. PAYMENT STATUS UPDATES
   ↓
9. IF FULL → Status: Paid ✅
   IF PARTIAL → Continue recording
   IF OVERDUE → Follow up
```

---

## ✨ Tips for Efficiency

1. **Use keyboard shortcuts** - Tab to navigate forms
2. **Set reminders** - For invoice generation dates
3. **Create templates** - Standard notes for common situations
4. **Batch process** - Generate multiple invoices in one sitting
5. **Regular backups** - Export invoices periodically
6. **Monitor dashboard** - Check summary cards daily

---

**Version:** 1.0  
**Last Updated:** January 5, 2026  
**Document Owner:** Accounting Department

---

**Need more help?** Contact your system administrator or check the technical documentation in `FRANCHISEE_INVOICING_GUIDE.md`
