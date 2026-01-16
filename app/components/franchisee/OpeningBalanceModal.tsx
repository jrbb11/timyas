import React, { useState } from 'react';
import { franchiseeInvoicesService } from '../../services/franchiseeInvoicesService';

interface OpeningBalanceModalProps {
    franchisee: {
        id: string;
        name: string;
        people_branches_id: string;
        branch_id: string;
        branch_name?: string;
    } | null;
    franchisees: Array<{
        id: string;
        name: string;
        people_branches_id: string;
        branch_id?: string;
        branch_name?: string;
    }>;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const OpeningBalanceModal: React.FC<OpeningBalanceModalProps> = ({
    franchisee: preSelectedFranchisee,
    franchisees,
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [selectedFranchiseeId, setSelectedFranchiseeId] = useState('');
    const [amount, setAmount] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('Opening Balance - Beginning payable');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get the selected franchisee data
    const selectedFranchisee = preSelectedFranchisee ||
        franchisees.find(f => f.id === selectedFranchiseeId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedFranchisee || !selectedFranchisee.branch_id) {
            setError('Please select a franchisee');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (!dueDate) {
            setError('Please select a due date');
            return;
        }

        setLoading(true);

        try {
            const amountNum = parseFloat(amount);

            // Create opening balance invoice
            const { data, error: err } = await franchiseeInvoicesService.create({
                people_branches_id: selectedFranchisee.people_branches_id,
                branch_id: selectedFranchisee.branch_id,
                franchisee_id: selectedFranchisee.id,
                invoice_date: invoiceDate,
                period_start: invoiceDate,
                period_end: invoiceDate,
                due_date: dueDate,
                subtotal: amountNum,
                tax_amount: 0,
                discount: 0,
                adjustment_amount: 0,
                total_amount: amountNum,
                paid_amount: 0,
                balance: amountNum,
                status: 'approved',
                payment_status: 'unpaid',
                notes: notes,
            });

            if (err) {
                throw err;
            }

            // Add a single line item for the opening balance
            if (data && data[0]) {
                const invoiceId = data[0].id;

                await franchiseeInvoicesService.addItem({
                    invoice_id: invoiceId,
                    sale_id: '',
                    description: 'Opening Balance',
                    sale_reference: 'OB-' + selectedFranchisee.name.substring(0, 10).replace(/\s/g, '').toUpperCase(),
                    sale_date: invoiceDate,
                    quantity: 1,
                    unit_price: amountNum,
                    discount: 0,
                    tax: 0,
                    shipping: 0,
                    line_total: amountNum,
                });
            }

            onSuccess();
            onClose();

            // Reset form
            setSelectedFranchiseeId('');
            setAmount('');
            setDueDate('');
            setNotes('Opening Balance - Beginning payable');
        } catch (error: any) {
            console.error('Error creating opening balance:', error);
            setError(error.message || 'Failed to create opening balance invoice');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(num);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Add Opening Balance</h2>
                    {selectedFranchisee && (
                        <p className="text-sm text-gray-600 mt-1">
                            Franchisee: <strong>{selectedFranchisee.name}</strong>
                            {selectedFranchisee.branch_name && (
                                <span className="text-gray-500 font-normal"> ({selectedFranchisee.branch_name})</span>
                            )}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Franchisee Selector - Only show if not pre-selected */}
                        {!preSelectedFranchisee && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Franchisee <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedFranchiseeId}
                                    onChange={(e) => setSelectedFranchiseeId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">-- Select Franchisee --</option>
                                    {franchisees.filter(f => f.branch_id).map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} {f.branch_name ? `(${f.branch_name})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Opening Balance Amount <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                                required
                            />
                            {amount && parseFloat(amount) > 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                    {formatCurrency(amount)}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Invoice Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Usually the date the franchisee started or first transaction date
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                min={invoiceDate}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Payment deadline for this opening balance
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Additional notes about this opening balance..."
                            />
                        </div>
                    </div>

                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <span className="text-blue-600 text-xl">ℹ️</span>
                            <div className="text-sm text-blue-900">
                                <p className="font-medium mb-1">What will happen:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>An approved invoice will be created</li>
                                    <li>Invoice will be marked as "Unpaid"</li>
                                    <li>Will appear in outstanding invoices report</li>
                                    <li>Franchisee can make payments against this invoice</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Opening Balance'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OpeningBalanceModal;
