import React, { useState } from 'react';
import { franchiseeCreditsService } from '../../services/franchiseeCreditsService';

interface PaymentAdjustmentModalProps {
  payment: {
    id: string;
    amount: number;
    payment_date: string;
    reference_number?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentAdjustmentModal: React.FC<PaymentAdjustmentModalProps> = ({
  payment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [adjustedAmount, setAdjustedAmount] = useState(payment.amount.toString());
  const [reason, setReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'correction' | 'reversal'>('correction');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const difference = parseFloat(adjustedAmount) - payment.amount;

  const handleValidateAndConfirm = () => {
    const validation = franchiseeCreditsService.validateAdjustment({
      original_amount: payment.amount,
      adjusted_amount: parseFloat(adjustedAmount),
      reason,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    setShowConfirmation(true);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Get current user ID (you'll need to get this from your auth context)
      const { data: { user } } = await import('../../utils/supabaseClient').then(m => m.supabase.auth.getUser());

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await franchiseeCreditsService.createPaymentAdjustment({
        payment_id: payment.id,
        adjustment_type: adjustmentType,
        original_amount: payment.amount,
        adjusted_amount: parseFloat(adjustedAmount),
        reason,
        adjusted_by: user.id,
      });

      if (error) {
        throw error;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating adjustment:', error);
      const errorMessage = (error as any).message || (error as any).details || 'Failed to create adjustment. Please try again.';
      setErrors([`Error: ${errorMessage}`]);
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔧 Adjust Payment</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {!showConfirmation ? (
            <>
              <div className="payment-info">
                <div className="info-row">
                  <span>Payment Date:</span>
                  <strong>{new Date(payment.payment_date).toLocaleDateString()}</strong>
                </div>
                {payment.reference_number && (
                  <div className="info-row">
                    <span>Reference:</span>
                    <strong>{payment.reference_number}</strong>
                  </div>
                )}
                <div className="info-row highlight">
                  <span>Original Amount:</span>
                  <strong>{formatCurrency(payment.amount)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="adjustmentType">Adjustment Type</label>
                <select
                  id="adjustmentType"
                  value={adjustmentType}
                  onChange={(e) => {
                    const type = e.target.value as 'correction' | 'reversal';
                    setAdjustmentType(type);
                    if (type === 'reversal') {
                      setAdjustedAmount('0');
                    } else {
                      setAdjustedAmount(payment.amount.toString());
                    }
                  }}
                  className="form-control"
                >
                  <option value="correction">Correction (Partial or Full)</option>
                  <option value="reversal">Full Reversal</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="adjustedAmount">Correct Amount</label>
                <input
                  id="adjustedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={adjustedAmount}
                  onChange={(e) => setAdjustedAmount(e.target.value)}
                  className="form-control"
                  disabled={adjustmentType === 'reversal'}
                />
                {adjustmentType === 'reversal' && (
                  <small className="form-hint">Reversal will set amount to ₱0.00</small>
                )}
              </div>

              {difference !== 0 && (
                <div className={`adjustment-summary ${difference > 0 ? 'increase' : 'decrease'}`}>
                  <span>Adjustment:</span>
                  <strong>
                    {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                  </strong>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="reason">
                  Reason for Adjustment <span className="required">*</span>
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="form-control"
                  rows={4}
                  placeholder="Please provide a detailed explanation for this adjustment (minimum 10 characters)..."
                />
                <small className="char-count">{reason.length} characters</small>
              </div>

              {errors.length > 0 && (
                <div className="error-box">
                  <strong>⚠️ Please fix the following errors:</strong>
                  <ul>
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="confirmation-box">
              <div className="confirmation-icon">⚠️</div>
              <h3>Confirm Payment Adjustment</h3>

              <div className="confirmation-details">
                <div className="detail-row">
                  <span>Original Amount:</span>
                  <strong>{formatCurrency(payment.amount)}</strong>
                </div>
                <div className="detail-row">
                  <span>Adjusted Amount:</span>
                  <strong className="highlight">{formatCurrency(parseFloat(adjustedAmount))}</strong>
                </div>
                <div className="detail-row">
                  <span>Difference:</span>
                  <strong className={difference > 0 ? 'increase' : 'decrease'}>
                    {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                  </strong>
                </div>
              </div>

              <div className="warning-box">
                <p><strong>This action will:</strong></p>
                <ul>
                  <li>Update the payment record</li>
                  <li>Recalculate the invoice balance</li>
                  <li>Create an audit log entry</li>
                  <li>Record your user ID and timestamp</li>
                </ul>
                <p className="warning-text">
                  ⚠️ <strong>This action cannot be undone.</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!showConfirmation ? (
            <>
              <button className="btn-cancel" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleValidateAndConfirm}
                disabled={loading}
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-cancel"
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
              >
                Back
              </button>
              <button
                className="btn-danger"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Adjustment'}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 2rem;
          color: #9ca3af;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          width: 32px;
          height: 32px;
        }

        .close-button:hover {
          color: #374151;
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .payment-info {
          background: #f9fafb;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          font-size: 0.875rem;
        }

        .info-row.highlight {
          border-top: 1px solid #e5e7eb;
          margin-top: 0.5rem;
          padding-top: 1rem;
          font-size: 1rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .required {
          color: #ef4444;
        }

        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
        }

        .form-control:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-hint {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          font-style: italic;
        }

        .char-count {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #9ca3af;
          text-align: right;
        }

        .adjustment-summary {
          padding: 1rem;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          font-size: 1.125rem;
          margin-bottom: 1.5rem;
        }

        .adjustment-summary.increase {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          color: #92400e;
        }

        .adjustment-summary.decrease {
          background: #fecaca;
          border: 1px solid #f87171;
          color: #991b1b;
        }

        .error-box {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: 6px;
          padding: 1rem;
          color: #991b1b;
        }

        .error-box ul {
          margin: 0.5rem 0 0 0;
          padding-left: 1.5rem;
        }

        .confirmation-box {
          text-align: center;
        }

        .confirmation-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .confirmation-box h3 {
          margin: 0 0 1.5rem 0;
          color: #111827;
        }

        .confirmation-details {
          background: #f9fafb;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row .highlight {
          color: #667eea;
        }

        .detail-row .increase {
          color: #f59e0b;
        }

        .detail-row .decrease {
          color: #ef4444;
        }

        .warning-box {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          padding: 1rem;
          text-align: left;
        }

        .warning-box ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .warning-text {
          margin-top: 1rem;
          margin-bottom: 0;
          color: #92400e;
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .btn-cancel {
          padding: 0.75rem 1.5rem;
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #f9fafb;
        }

        .btn-primary {
          padding: 0.75rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #5568d3;
        }

        .btn-danger {
          padding: 0.75rem 1.5rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
        }

        .btn-cancel:disabled,
        .btn-primary:disabled,
        .btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default PaymentAdjustmentModal;
