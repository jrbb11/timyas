import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { salePaymentsService } from '../services/salePaymentsService';

const mockLedger = [
  { id: 1, type: 'Deposit', account: 'Cash', amount: 500, date: '2024-07-01', description: 'Deposit from sales' },
  { id: 2, type: 'Expense', account: 'Bank', amount: -300, date: '2024-07-02', description: 'Electricity bill' },
  { id: 3, type: 'Transfer', account: 'Bank', amount: 200, date: '2024-07-03', description: 'Transfer to bank' },
];

const mockMethods = [
  { id: 1, name: 'Cash' },
  { id: 2, name: 'Bank Transfer' },
  { id: 3, name: 'Credit Card' },
];
const mockAccounts = [
  { id: 1, name: 'Cash' },
  { id: 2, name: 'Bank' },
  { id: 3, name: 'Credit Card' },
];

const Ledger = () => {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'ledger' | 'payments'>('ledger');
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const filtered = mockLedger.filter(l =>
    l.account.toLowerCase().includes(search.toLowerCase()) ||
    l.type.toLowerCase().includes(search.toLowerCase()) ||
    l.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (tab === 'payments') {
      setLoadingPayments(true);
      salePaymentsService.getAll().then(({ data }) => {
        setPayments(data || []);
        setLoadingPayments(false);
      });
    }
  }, [tab]);

  return (
    <AdminLayout title="Ledger" breadcrumb={<span>Finance &gt; <span className="text-gray-900">Ledger</span></span>}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Ledger</h1>
        </div>
        <div className="flex gap-4 mb-4">
          <button className={`px-4 py-2 rounded ${tab === 'ledger' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setTab('ledger')}>Ledger</button>
          <button className={`px-4 py-2 rounded ${tab === 'payments' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setTab('payments')}>Payments</button>
        </div>
        {tab === 'ledger' ? (
          <>
            <input
              className="mb-4 p-2 border rounded w-full max-w-xs"
              placeholder="Search ledger..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="bg-white rounded shadow p-4 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Account</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => (
                    <tr key={l.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{l.type}</td>
                      <td className="p-2">{l.account}</td>
                      <td className="p-2 text-right">{Number(l.amount).toFixed(2)}</td>
                      <td className="p-2">{l.date}</td>
                      <td className="p-2">{l.description}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="text-center p-4 text-gray-400">No transactions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="bg-white rounded shadow p-4 overflow-x-auto">
            {loadingPayments ? (
              <div className="p-8 text-center text-gray-500">Loading payments...</div>
            ) : payments.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No payments found.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Method</th>
                    <th className="text-left p-2">Account</th>
                    <th className="text-left p-2">Reference</th>
                    <th className="text-left p-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{p.payment_date}</td>
                      <td className="p-2">{Number(p.amount).toLocaleString()}</td>
                      <td className="p-2">{mockMethods.find(m => m.id === p.payment_method_id)?.name || p.payment_method_id}</td>
                      <td className="p-2">{mockAccounts.find(a => a.id === p.account_id)?.name || p.account_id}</td>
                      <td className="p-2">{p.reference_number}</td>
                      <td className="p-2">Sale Payment</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Ledger; 