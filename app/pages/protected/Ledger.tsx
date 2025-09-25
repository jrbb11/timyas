import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { salePaymentsService } from '../../services/salePaymentsService';
import { FaSearch } from 'react-icons/fa';
import { PermissionGuard } from '../../components/PermissionComponents';

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
    <PermissionGuard
      resource="financial"
      action="read"
      fallback={
        <AdminLayout title="Ledger" breadcrumb={<span>Finance &gt; <span className="text-gray-900">Ledger</span></span>}>
          <div className="p-6">
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="text-gray-400">
                <div className="text-6xl mb-4">🔒</div>
                <div className="text-xl font-semibold mb-2">Financial Data Access Restricted</div>
                <div>You don't have permission to view ledger data</div>
              </div>
            </div>
          </div>
        </AdminLayout>
      }
    >
      <AdminLayout title="Ledger" breadcrumb={<span>Finance &gt; <span className="text-gray-900">Ledger</span></span>}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1 flex gap-2 items-center">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search ledger..."
                className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg w-full text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            <button className={`px-4 py-2 rounded-lg font-semibold transition ${tab === 'ledger' ? 'bg-black text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} onClick={() => setTab('ledger')}>Ledger</button>
            <button className={`px-4 py-2 rounded-lg font-semibold transition ${tab === 'payments' ? 'bg-black text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} onClick={() => setTab('payments')}>Payments</button>
          </div>
        </div>
        {tab === 'ledger' ? (
          <div className="bg-white rounded-xl shadow p-0 overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-semibold">Type</th>
                  <th className="p-4 text-left font-semibold">Account</th>
                  <th className="p-4 text-right font-semibold">Amount</th>
                  <th className="p-4 text-left font-semibold">Date</th>
                  <th className="p-4 text-left font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{l.type}</td>
                    <td className="p-4">{l.account}</td>
                    <td className="p-4 text-right">{Number(l.amount).toFixed(2)}</td>
                    <td className="p-4">{l.date}</td>
                    <td className="p-4">{l.description}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center p-6 text-gray-400">No transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-0 overflow-x-auto">
            {loadingPayments ? (
              <div className="p-8 text-center text-gray-500">Loading payments...</div>
            ) : payments.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No payments found.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left font-semibold">Date</th>
                    <th className="p-4 text-left font-semibold">Amount</th>
                    <th className="p-4 text-left font-semibold">Method</th>
                    <th className="p-4 text-left font-semibold">Account</th>
                    <th className="p-4 text-left font-semibold">Reference</th>
                    <th className="p-4 text-left font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{p.payment_date}</td>
                      <td className="p-4">{Number(p.amount).toLocaleString()}</td>
                      <td className="p-4">{mockMethods.find(m => m.id === p.payment_method_id)?.name || p.payment_method_id}</td>
                      <td className="p-4">{mockAccounts.find(a => a.id === p.account_id)?.name || p.account_id}</td>
                      <td className="p-4">{p.reference_number}</td>
                      <td className="p-4">Sale Payment</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
    </PermissionGuard>
  );
};

export default Ledger; 