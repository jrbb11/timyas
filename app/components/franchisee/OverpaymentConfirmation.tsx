import React from 'react';

interface OverpaymentConfirmationProps {
  invoiceAmount: number;
  paymentAmount: number;
  invoiceNumber?: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const OverpaymentConfirmation: React.FC<OverpaymentConfirmationProps> = ({
  invoiceAmount,
  paymentAmount,
  invoiceNumber,
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const excessAmount = paymentAmount - invoiceAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (!isOpen || excessAmount <= 0) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="warning-icon">⚠️</div>
          <h2>Overpayment Detected</h2>
        </div>

        <div className="modal-body">
          {invoiceNumber && (
            <div className="invoice-info">
              <strong>Invoice: {invoiceNumber}</strong>
            </div>
          )}

          <div className="amounts-display">
            <div className="amount-row">
              <span className="label">Invoice Amount:</span>
              <span className="value">{formatCurrency(invoiceAmount)}</span>
            </div>

            <div className="amount-row">
              <span className="label">Payment Entered:</span>
              <span className="value payment">{formatCurrency(paymentAmount)}</span>
            </div>

            <div className="divider"></div>

            <div className="amount-row excess">
              <span className="label">Excess Amount:</span>
              <span className="value">{formatCurrency(excessAmount)}</span>
            </div>
          </div>

          <div className="info-box">
            <div className="info-icon">ℹ️</div>
            <div className="info-content">
              <p><strong>What happens next:</strong></p>
              <ul>
                <li>The excess amount of <strong>{formatCurrency(excessAmount)}</strong> will be converted to a credit balance for this branch</li>
                <li>This credit will be <strong>automatically applied to any old unpaid invoices</strong> (waterfall payment)</li>
                <li>Any remaining amount will be available for future invoices</li>
                <li>You can view the credit history in the franchisee's credit history modal</li>
              </ul>
            </div>
          </div>

          <div className="confirmation-checkbox">
            <label className="checkbox-label">
              <input type="checkbox" id="confirmOverpayment" required />
              <span>I confirm this payment amount is correct</span>
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-confirm"
            onClick={() => {
              const checkbox = document.getElementById('confirmOverpayment') as HTMLInputElement;
              if (checkbox && checkbox.checked) {
                onConfirm();
              } else {
                alert('Please confirm that the payment amount is correct');
              }
            }}
          >
            Confirm Payment
          </button>
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
          max-width: 550px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          text-align: center;
          padding: 2rem 1.5rem 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .warning-icon {
          font-size: 4rem;
          margin-bottom: 0.5rem;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .invoice-info {
          text-align: center;
          margin-bottom: 1.5rem;
          padding: 0.75rem;
          background: #f3f4f6;
          border-radius: 6px;
          color: #374151;
        }

        .amounts-display {
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .amount-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
        }

        .amount-row .label {
          font-size: 0.975rem;
          color: #6b7280;
          font-weight: 500;
        }

        .amount-row .value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .amount-row .value.payment {
          color: #f59e0b;
        }

        .divider {
          height: 2px;
          background: linear-gradient(to right, transparent, #e5e7eb, transparent);
          margin: 1rem 0;
        }

        .amount-row.excess {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          margin: -0.5rem -1rem;
          padding: 1rem 1.5rem;
          border-radius: 6px;
        }

        .amount-row.excess .label {
          color: #92400e;
          font-weight: 600;
        }

        .amount-row.excess .value {
          color: #b45309;
          font-size: 1.5rem;
        }

        .info-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          gap: 1rem;
        }

        .info-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .info-content {
          flex: 1;
        }

        .info-content p {
          margin: 0 0 0.5rem 0;
          color: #1e40af;
          font-weight: 500;
        }

        .info-content ul {
          margin: 0;
          padding-left: 1.25rem;
          color: #1e3a8a;
        }

        .info-content li {
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .confirmation-checkbox {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          padding: 1rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-weight: 500;
          color: #92400e;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
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

        .btn-cancel:hover {
          background: #f9fafb;
        }

        .btn-confirm {
          padding: 0.75rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-confirm:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default OverpaymentConfirmation;
