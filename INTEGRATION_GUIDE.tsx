/**
 * Integration Instructions for FranchiseeInvoiceView.tsx
 * 
 * This file outlines the changes needed to integrate credit balance
 * and payment adjustment features into the existing invoice view.
 */

// ==================== IMPORTS TO ADD ====================

import { CreditBalanceCard } from '../../components/franchisee/CreditBalanceCard';
import { CreditHistoryModal } from '../../components/franchisee/CreditHistoryModal';
import { PaymentAdjustmentModal } from '../../components/franchisee/PaymentAdjustmentModal';
import { OverpaymentConfirmation } from '../../components/franchisee/OverpaymentConfirmation';
import { franchiseeCreditsService } from '../../services/franchiseeCreditsService';

// ==================== STATE TO ADD ====================

// Credit history modal
const [showCreditHistory, setShowCreditHistory] = useState(false);

// Payment adjustment modal
const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
const [selectedPayment, setSelectedPayment] = useState<any>(null);

// Overpayment confirmation
const [showOverpaymentConfirmation, setShowOverpaymentConfirmation] = useState(false);
const [overpaymentData, setOverpaymentData] = useState({
    invoiceAmount: 0,
    paymentAmount: 0,
});

// ==================== MODIFY handleAddPayment FUNCTION ====================

const handleAddPayment = async () => {
    if (!id || !paymentAmount) return;

    const invoiceBalance = invoice.balance;
    const paymentAmountNum = parseFloat(paymentAmount);

    // Check for overpayment
    if (paymentAmountNum > invoiceBalance) {
        setOverpaymentData({
            invoiceAmount: invoiceBalance,
            paymentAmount: paymentAmountNum,
        });
        setShowOverpaymentConfirmation(true);
        return;
    }

    // Continue with normal payment processing
    await processPayment();
};

// ==================== NEW FUNCTION: processPayment ====================

const processPayment = async () => {
    if (!id || !paymentAmount) return;

    setPaymentLoading(true);
    let receiptUrl = null;

    try {
        // Upload receipt if file is selected
        if (receiptFile) {
            const fileExt = receiptFile.name.split('.').pop();
            const fileName = `${id}_${Date.now()}.${fileExt}`;
            const filePath = `franchisee-receipts/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, receiptFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('receipts')
                .getPublicUrl(filePath);

            receiptUrl = urlData.publicUrl;
        }

        const paymentAmountNum = parseFloat(paymentAmount);
        const invoiceBalance = invoice.balance;

        // Record payment
        const { error: err } = await franchiseeInvoicesService.addPayment({
            invoice_id: id,
            amount: paymentAmountNum,
            payment_date: paymentDate,
            payment_method_id: paymentMethod ? parseInt(paymentMethod) : undefined,
            reference_number: referenceNumber || undefined,
            notes: paymentNotes || undefined,
            receipt_url: receiptUrl || undefined,
            account_id: 1 // Default account - should be selectable
        });

        if (err) {
            alert('Error recording payment: ' + err.message);
            return;
        }

        // Create credit if overpayment
        if (paymentAmountNum > invoiceBalance) {
            const excessAmount = paymentAmountNum - invoiceBalance;

            await franchiseeCreditsService.createCreditFromOverpayment({
                franchisee_id: invoice.franchisee_id,
                amount: excessAmount,
                source_invoice_id: id,
                notes: `Overpayment from invoice ${invoice.invoice_number}`,
            });
        }

        // Reset form and close modals
        setShowPaymentModal(false);
        setShowOverpaymentConfirmation(false);
        setPaymentAmount('');
        setPaymentMethod('');
        setReferenceNumber('');
        setPaymentNotes('');
        setReceiptFile(null);
        loadInvoice();
    } catch (error: any) {
        alert('Error: ' + error.message);
    }

    setPaymentLoading(false);
};

// ==================== NEW FUNCTION: handleAdjustPayment ====================

const handleAdjustPayment = (payment: any) => {
    setSelectedPayment(payment);
    setShowAdjustmentModal(true);
};

const handleAdjustmentSuccess = () => {
    setShowAdjustmentModal(false);
    setSelectedPayment(null);
    loadInvoice();
};

// ==================== UI COMPONENTS TO ADD ====================

/*
 * Add CreditBalanceCard after the "Bill To" section (around line 338)
 * Place it in the grid-cols-2 div as a third column or create a new row
 */

// Option 1: Create a new row before "Parties Information"
<div className="mb-8">
  <CreditBalanceCard
    franchiseeId={invoice.franchisee_id}
    onViewHistory={() => setShowCreditHistory(true)}
  />
</div>

/*
 * Add "Adjust" button to each payment in the Payment History table
 * Modify the payment history table row (around line 516-547)
 */

// Add a new column header
<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
  Actions
</th>

// Add in the tbody for each payment row
<td className="px-4 py-3 text-sm">
  <button
    onClick={() => handleAdjustPayment(payment)}
    className="text-blue-600 hover:text-blue-800 underline text-sm"
  >
    Adjust
  </button>
</td>

/*
 * Add modals at the end, before the closing </AdminLayout> tag
 */

{/* Credit History Modal */ }
<CreditHistoryModal
    franchiseeId={invoice.franchisee_id}
    isOpen={showCreditHistory}
    onClose={() => setShowCreditHistory(false)}
/>

{/* Payment Adjustment Modal */ }
{
    selectedPayment && (
        <PaymentAdjustmentModal
            payment={selectedPayment}
            isOpen={showAdjustmentModal}
            onClose={() => {
                setShowAdjustmentModal(false);
                setSelectedPayment(null);
            }}
            onSuccess={handleAdjustmentSuccess}
        />
    )
}

{/* Overpayment Confirmation Modal */ }
<OverpaymentConfirmation
    invoiceAmount={overpaymentData.invoiceAmount}
    paymentAmount={overpaymentData.paymentAmount}
    invoiceNumber={invoice.invoice_number}
    isOpen={showOverpaymentConfirmation}
    onConfirm={processPayment}
    onCancel={() => {
        setShowOverpaymentConfirmation(false);
        setOverpaymentData({ invoiceAmount: 0, paymentAmount: 0 });
    }}
/>

// ==================== SUMMARY ====================

/**
 * Integration Steps:
 * 
 * 1. Add imports at the top
 * 2. Add new state variables
 * 3. Replace handleAddPayment function
 * 4. Add processPayment function
 * 5. Add handleAdjustPayment and handleAdjustmentSuccess functions
 * 6. Add CreditBalanceCard component in the UI
 * 7. Add "Adjust" button column in payment history table
 * 8. Add the three modals at the end
 * 
 * This will enable:
 * - Display of franchisee credit balance
 * - Overpayment detection and credit creation
 * - Payment adjustment functionality
 * - Credit history viewing
 */
