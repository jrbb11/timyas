import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { franchiseeInvoicesService } from '../../services/franchiseeInvoicesService';
import { getCurrentUser, supabase } from '../../utils/supabaseClient';
import { CreditBalanceCard } from '../../components/franchisee/CreditBalanceCard';
import { CreditHistoryModal } from '../../components/franchisee/CreditHistoryModal';
import { PaymentAdjustmentModal } from '../../components/franchisee/PaymentAdjustmentModal';
import { OverpaymentConfirmation } from '../../components/franchisee/OverpaymentConfirmation';
import { franchiseeCreditsService } from '../../services/franchiseeCreditsService';

const FranchiseeInvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  // Edit Invoice Date
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newInvoiceDate, setNewInvoiceDate] = useState('');

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

  // Credit Application State
  const [creditApplications, setCreditApplications] = useState<any[]>([]);
  const [availableCredit, setAvailableCredit] = useState(0);

  useEffect(() => {
    if (id) loadInvoice();
    loadPaymentMethods();
  }, [id]);

  const loadPaymentMethods = async () => {
    const { data } = await supabase.from('payment_methods').select('*');
    if (data) setPaymentMethods(data);
  };

  const loadInvoice = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await franchiseeInvoicesService.getById(id);

    if (err) {
      setError(err.message);
    } else {
      setInvoice(data);
      if (data?.invoice_date) {
        setNewInvoiceDate(data.invoice_date);
      }

      // Load credit applications
      const { data: creditApps } = await franchiseeCreditsService.getInvoiceCreditApplications(id);
      if (creditApps) setCreditApplications(creditApps);

      // Load available credit if franchisee is known
      if (data?.franchisee_id) {
        loadFranchiseeCredits(data.franchisee_id);
      }
    }
    setLoading(false);
  };

  const handleUpdateDate = async () => {
    if (!id || !newInvoiceDate) return;

    // Calculate the number of days between original invoice_date and due_date
    const originalInvoiceDate = new Date(invoice.invoice_date);
    const originalDueDate = new Date(invoice.due_date);
    const dueDays = Math.round((originalDueDate.getTime() - originalInvoiceDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate new due_date based on new invoice_date
    const newInvoiceDateObj = new Date(newInvoiceDate);
    const newDueDate = new Date(newInvoiceDateObj);
    newDueDate.setDate(newDueDate.getDate() + dueDays);

    const { error: err } = await franchiseeInvoicesService.update(id, {
      invoice_date: newInvoiceDate,
      due_date: newDueDate.toISOString().split('T')[0]
    });

    if (err) {
      alert('Error updating invoice date: ' + err.message);
    } else {
      setIsEditingDate(false);
      loadInvoice();
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;

    const user = await getCurrentUser();
    const { error: err } = await franchiseeInvoicesService.updateStatus(id, newStatus as any, user?.id);

    if (err) {
      alert('Error updating status: ' + err.message);
    } else {
      loadInvoice();
    }
  };

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

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;

    setLoading(true);
    const { error: err } = await franchiseeInvoicesService.delete(id);

    if (err) {
      alert('Error deleting invoice: ' + err.message);
      setLoading(false);
    } else {
      navigate('/franchisee-invoices');
    }
  };

  const loadFranchiseeCredits = async (franchiseeId: string) => {
    const { balance } = await franchiseeCreditsService.getAvailableCreditBalance(franchiseeId);
    setAvailableCredit(balance);
  };

  const handleApplyCredit = async () => {
    if (!invoice?.id || !invoice?.franchisee_id) return;

    if (!window.confirm('Are you sure you want to apply available credits to this invoice?')) {
      return;
    }

    setLoading(true);
    try {
      const { data: appliedAmount, error } = await franchiseeCreditsService.autoApplyCreditsToInvoice(invoice.id);

      if (error) throw error;

      if (appliedAmount > 0) {
        await loadInvoice();
        // createCreditFromOverpayment might have changed balance
        await loadFranchiseeCredits(invoice.franchisee_id);
        alert(`Successfully applied ${formatCurrency(appliedAmount)} from available credits.`);
      } else {
        alert('No credits were applied. Either the invoice is paid or no credits are available.');
      }
    } catch (error) {
      console.error('Error applying credits:', error);
      alert('Failed to apply credits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleAdjustPayment = (payment: any) => {
    setSelectedPayment(payment);
    setShowAdjustmentModal(true);
  };

  const handleAdjustmentSuccess = () => {
    setShowAdjustmentModal(false);
    setSelectedPayment(null);
    loadInvoice();
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      unpaid: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout title="Loading..." breadcrumb={<span>Loading...</span>}>
        <div className="p-8 text-center text-gray-500">Loading invoice...</div>
      </AdminLayout>
    );
  }

  if (error || !invoice) {
    return (
      <AdminLayout title="Error" breadcrumb={<span>Error</span>}>
        <div className="p-8 text-center text-red-600">{error || 'Invoice not found'}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={`Invoice ${invoice.invoice_number}`}
      breadcrumb={
        <span>
          Invoicing &gt; Franchisee Invoices &gt; <span className="text-gray-900">{invoice.invoice_number}</span>
        </span>
      }
    >
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/franchisee-invoices')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Invoices
          </button>
          <div className="flex space-x-3">
            {invoice.payment_status !== 'paid' && invoice.status !== 'cancelled' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Record Payment
              </button>
            )}
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
              Export PDF
            </button>
            <button
              onClick={handleDelete}
              className="border border-red-300 text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 ml-2"
            >
              Delete
            </button>
            {invoice.status === 'draft' && (
              <>
                <button
                  onClick={() => handleStatusChange('sent')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Mark as Sent
                </button>
                <button
                  onClick={() => handleStatusChange('approved')}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                  Approve
                </button>
              </>
            )}
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {/* Invoice Header */}
          <div className="border-b pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <div className="text-gray-600">
                  <div className="font-medium text-lg">{invoice.invoice_number}</div>

                  <div className="text-sm flex items-center gap-2">
                    <span>Invoice Date:</span>
                    {isEditingDate ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="date"
                          value={newInvoiceDate}
                          onChange={(e) => setNewInvoiceDate(e.target.value)}
                          className="border rounded px-1 py-0.5 text-xs"
                        />
                        <button
                          onClick={handleUpdateDate}
                          className="bg-green-600 text-white px-2 py-0.5 rounded text-xs hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingDate(false);
                            setNewInvoiceDate(invoice.invoice_date);
                          }}
                          className="bg-gray-300 text-gray-800 px-2 py-0.5 rounded text-xs hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{formatDate(invoice.invoice_date)}</span>
                        {invoice.status !== 'cancelled' && invoice.payment_status !== 'paid' && (
                          <button
                            onClick={() => setIsEditingDate(true)}
                            className="text-blue-600 hover:text-blue-800 text-xs underline"
                            title="Edit Invoice Date"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-sm">Due Date: {formatDate(invoice.due_date)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="mb-2">{getStatusBadge(invoice.status)}</div>
                <div>{getPaymentStatusBadge(invoice.payment_status)}</div>
              </div>
            </div>
          </div>

          {/* Credit Balance Card */}
          {invoice.franchisee_id && (
            <div className="mb-8">
              <CreditBalanceCard
                franchiseeId={invoice.franchisee_id}
                onViewHistory={() => setShowCreditHistory(true)}
              />
            </div>
          )}

          {/* Parties Information */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Bill To:</h3>
              <div className="text-gray-700">
                <div className="font-medium text-lg">{invoice.franchisee?.name}</div>
                {invoice.franchisee?.email && <div>{invoice.franchisee.email}</div>}
                {invoice.franchisee?.phone && <div>{invoice.franchisee.phone}</div>}
                {invoice.franchisee?.address && (
                  <div className="mt-2 text-sm">
                    {invoice.franchisee.address}
                    {invoice.franchisee.city && `, ${invoice.franchisee.city}`}
                    {invoice.franchisee.country && `, ${invoice.franchisee.country}`}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Branch:</h3>
              <div className="text-gray-700">
                <div className="font-medium text-lg">{invoice.branch?.name}</div>
                <div className="text-sm text-gray-500">Code: {invoice.branch?.code}</div>
                {invoice.branch?.address && (
                  <div className="mt-2 text-sm">
                    {invoice.branch.address}
                    {invoice.branch.city && `, ${invoice.branch.city}`}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Period Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600">
              Billing Period: <span className="font-medium text-gray-900">
                {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
              </span>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Invoice Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoice #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sale Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Shipping
                    </th>
                    {/* <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Tax
                    </th> */}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Breakdown
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{item.sale_reference}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(item.sale_date)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600">
                        {item.shipping > 0 ? formatCurrency(item.shipping || 0) : '-'}
                      </td>
                      {/* <td className="px-4 py-3 text-sm text-right text-red-600">
                        {formatCurrency(item.discount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatCurrency(item.tax)}
                      </td> */}
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="font-mono text-xs">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                          {item.shipping > 0 && ` + ${formatCurrency(item.shipping)}`}
                          {item.discount > 0 && ` - ${formatCurrency(item.discount)}`}
                          {item.tax > 0 && ` + ${formatCurrency(item.tax)}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {(invoice.items?.reduce((sum: number, item: any) => sum + parseFloat(item.shipping || 0), 0) || 0) > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Shipping Fee:</span>
                  <span className="font-medium text-blue-600">{formatCurrency(
                    invoice.items?.reduce((sum: number, item: any) => sum + parseFloat(item.shipping || 0), 0) || 0
                  )}</span>
                </div>
              )}
              {parseFloat(invoice.discount) > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Discount:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-700">
                <span>Tax:</span>
                <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>

              {/* Split Paid and Credit */}
              <div className="flex justify-between text-green-600">
                <span>Paid (Cash/Cheque):</span>
                <span className="font-medium">
                  {formatCurrency(
                    Math.max(0, parseFloat(invoice.paid_amount || '0') - creditApplications.reduce((sum, app) => sum + parseFloat(app.amount_applied), 0))
                  )}
                </span>
              </div>

              {creditApplications.reduce((sum, app) => sum + parseFloat(app.amount_applied), 0) > 0 && (
                <div className="flex justify-between text-purple-600 italic">
                  <span>Used Credit:</span>
                  <span className="font-medium">
                    {formatCurrency(creditApplications.reduce((sum, app) => sum + parseFloat(app.amount_applied), 0))}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold text-orange-600 border-t pt-2">
                <span>Balance Due:</span>
                <span>{formatCurrency(invoice.balance)}</span>
              </div>

              {/* Apply Credit Button */}
              {invoice.balance > 0 && availableCredit > 0 && (
                <div className="pt-4 text-right">
                  <button
                    onClick={handleApplyCredit}
                    disabled={loading}
                    className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 transition-colors"
                  >
                    ✨ Apply Available Credit ({formatCurrency(availableCredit)})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-bold text-gray-900 mb-2">Notes:</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4">Payment History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Payment Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reference
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Receipt
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.payments.map((payment: any) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.payment_method?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.reference_number || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.notes || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {payment.receipt_url ? (
                          <a
                            href={payment.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View Receipt
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleAdjustPayment(payment)}
                          className="text-blue-600 hover:text-blue-800 underline text-sm"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Record Payment</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="0.00"
                  step="0.01"
                  max={invoice.balance}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Balance due: {formatCurrency(invoice.balance)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option value="">Select payment method</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="e.g., Check #1234, Transaction ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt Upload
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
                {receiptFile && (
                  <div className="text-xs text-green-600 mt-1">
                    Selected: {receiptFile.name}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                disabled={paymentLoading || !paymentAmount}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-300"
              >
                {paymentLoading ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit History Modal */}
      {invoice && (
        <CreditHistoryModal
          franchiseeId={invoice.franchisee_id}
          isOpen={showCreditHistory}
          onClose={() => setShowCreditHistory(false)}
        />
      )}

      {/* Payment Adjustment Modal */}
      {selectedPayment && (
        <PaymentAdjustmentModal
          payment={selectedPayment}
          isOpen={showAdjustmentModal}
          onClose={() => {
            setShowAdjustmentModal(false);
            setSelectedPayment(null);
          }}
          onSuccess={handleAdjustmentSuccess}
        />
      )}

      {/* Overpayment Confirmation Modal */}
      {invoice && (
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
      )}
    </AdminLayout>
  );
};

export default FranchiseeInvoiceView;
