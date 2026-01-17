import React, { useEffect, useState } from 'react';
import { franchiseeCreditsService, type CreditWithInvoice } from '../../services/franchiseeCreditsService';

interface CreditHistoryModalProps {
  franchiseeId: string;
  peopleBranchesId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CreditHistoryModal: React.FC<CreditHistoryModalProps> = ({
  franchiseeId,
  peopleBranchesId,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<CreditWithInvoice[]>([]);
  const [showUsed, setShowUsed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCreditHistory();
    }
  }, [isOpen, franchiseeId, showUsed]);

  const loadCreditHistory = async () => {
    setLoading(true);
    const { data, error } = await franchiseeCreditsService.getFranchiseeCredits(franchiseeId, peopleBranchesId, showUsed);

    if (!error && data) {
      setCredits(data as CreditWithInvoice[]);
    }

    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'overpayment':
        return '💰 Overpayment';
      case 'return':
        return '↩️ Return';
      case 'adjustment':
        return '🔧 Adjustment';
      default:
        return sourceType;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Credit History</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="filter-bar">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showUsed}
                onChange={(e) => setShowUsed(e.target.checked)}
              />
              <span>Show fully used credits</span>
            </label>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner">Loading...</div>
            </div>
          ) : credits.length === 0 ? (
            <div className="empty-state">
              <p>No credit history found</p>
            </div>
          ) : (
            <div className="credits-list">
              {credits.map((credit) => (
                <div key={credit.id} className="credit-item">
                  <div className="credit-header">
                    <div className="credit-source">
                      {getSourceLabel(credit.source_type)}
                    </div>
                    <div className="credit-date">
                      {formatDate(credit.created_at)}
                    </div>
                  </div>

                  <div className="credit-amounts">
                    <div className="amount-row">
                      <span>Original Amount:</span>
                      <span className="amount">{formatCurrency(credit.amount)}</span>
                    </div>
                    <div className="amount-row">
                      <span>Used:</span>
                      <span className="amount used">
                        {formatCurrency(credit.used_amount)}
                      </span>
                    </div>
                    <div className="amount-row">
                      <span>Remaining:</span>
                      <span className={`amount ${credit.remaining_amount > 0 ? 'available' : 'depleted'}`}>
                        {formatCurrency(credit.remaining_amount)}
                      </span>
                    </div>
                  </div>

                  {credit.source_invoice && (
                    <div className="credit-source-info">
                      <span>Source Invoice: </span>
                      <strong>{credit.source_invoice.invoice_number}</strong>
                    </div>
                  )}

                  {credit.notes && (
                    <div className="credit-notes">
                      <em>{credit.notes}</em>
                    </div>
                  )}

                  {credit.applications && credit.applications.length > 0 && (
                    <div className="applications-section">
                      <div className="applications-header">Applied To:</div>
                      <div className="applications-list">
                        {credit.applications.map((app) => (
                          <div key={app.invoice_id} className="application-item">
                            <span>{app.invoice?.invoice_number || app.invoice_id}</span>
                            <span>{formatCurrency(app.amount_applied)}</span>
                            <span className="app-date">{formatDate(app.applied_at)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>
            Close
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
          max-width: 800px;
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

        .filter-bar {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .checkbox-label input[type="checkbox"] {
          cursor: pointer;
        }

        .loading-state,
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .credits-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .credit-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          background: white;
        }

        .credit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .credit-source {
          font-weight: 600;
          color: #374151;
        }

        .credit-date {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .credit-amounts {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .amount-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .amount-row span:first-child {
          color: #6b7280;
        }

        .amount-row .amount {
          font-weight: 600;
        }

        .amount-row .amount.used {
          color: #ef4444;
        }

        .amount-row .amount.available {
          color: #10b981;
        }

        .amount-row .amount.depleted {
          color: #9ca3af;
        }

        .credit-source-info {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .credit-notes {
          font-size: 0.875rem;
          color: #6b7280;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .applications-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
        }

        .applications-header {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .applications-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .application-item {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 1rem;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .app-date {
          color: #6b7280;
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
        }

        .btn-close {
          padding: 0.75rem 1.5rem;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-close:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default CreditHistoryModal;
