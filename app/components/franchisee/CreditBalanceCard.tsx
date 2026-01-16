import React, { useEffect, useState } from 'react';
import { franchiseeCreditsService } from '../../services/franchiseeCreditsService';

interface CreditBalanceCardProps {
    franchiseeId: string;
    onViewHistory?: () => void;
}

export const CreditBalanceCard: React.FC<CreditBalanceCardProps> = ({
    franchiseeId,
    onViewHistory,
}) => {
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [summary, setSummary] = useState({
        total_credits: 0,
        total_used: 0,
        total_remaining: 0,
    });

    useEffect(() => {
        loadCreditData();
    }, [franchiseeId]);

    const loadCreditData = async () => {
        setLoading(true);

        // Get available balance
        const { balance: availableBalance } = await franchiseeCreditsService.getAvailableCreditBalance(franchiseeId);
        setBalance(availableBalance);

        // Get credit summary
        const { summary: creditSummary } = await franchiseeCreditsService.getCreditSummary(franchiseeId);
        setSummary(creditSummary);

        setLoading(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="credit-balance-card loading">
                <div className="spinner">Loading...</div>
            </div>
        );
    }

    return (
        <div className="credit-balance-card">
            <div className="card-header">
                <h3>💳 Credit Balance</h3>
            </div>

            <div className="card-body">
                <div className="balance-display">
                    <div className="balance-amount">
                        <span className="label">Available Credit:</span>
                        <span className="amount">{formatCurrency(balance)}</span>
                    </div>

                    {balance > 0 && (
                        <div className="credit-info">
                            <p className="info-text">
                                ℹ️ This credit will be automatically applied to your next invoice
                            </p>
                        </div>
                    )}
                </div>

                {summary.total_credits > 0 && (
                    <div className="credit-summary">
                        <div className="summary-row">
                            <span>Total Credits:</span>
                            <span>{formatCurrency(summary.total_credits)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Used:</span>
                            <span className="used">{formatCurrency(summary.total_used)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Remaining:</span>
                            <span className="remaining">{formatCurrency(summary.total_remaining)}</span>
                        </div>
                    </div>
                )}

                {onViewHistory && (
                    <button
                        className="btn-view-history"
                        onClick={onViewHistory}
                    >
                        View Credit History
                    </button>
                )}
            </div>

            <style>{`
        .credit-balance-card {
          Background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .credit-balance-card.loading {
          padding: 2rem;
          text-align: center;
        }

        .card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem 1.5rem;
          color: white;
        }

        .card-header h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .card-body {
          padding: 1.5rem;
        }

        .balance-display {
          margin-bottom: 1rem;
        }

        .balance-amount {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .balance-amount .label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .balance-amount .amount {
          font-size: 2rem;
          font-weight: 700;
          color: #10b981;
        }

        .credit-info {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 6px;
          padding: 0.75rem;
          margin-bottom: 1rem;
        }

        .info-text {
          margin: 0;
          font-size: 0.875rem;
          color: #065f46;
        }

        .credit-summary {
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
          margin-bottom: 1rem;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          font-size: 0.875rem;
        }

        .summary-row span:first-child {
          color: #6b7280;
        }

        .summary-row span:last-child {
          font-weight: 600;
          color: #111827;
        }

        .summary-row .used {
          color: #ef4444;
        }

        .summary-row .remaining {
          color: #10b981;
        }

        .btn-view-history {
          width: 100%;
          padding: 0.75rem;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-view-history:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        .spinner {
          display: inline-block;
          color: #667eea;
        }
      `}</style>
        </div>
    );
};

export default CreditBalanceCard;
