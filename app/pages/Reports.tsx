import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { FaChartBar, FaCalendarAlt, FaFileCsv } from 'react-icons/fa';
import ReportSummaryCard from '../components/ui/ReportSummaryCard';

const Reports = () => {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Placeholder data
  const summary = [
    { label: 'Total Sales', value: '₱120,000', icon: <FaChartBar className="text-blue-500" /> },
    { label: 'Total Purchases', value: '₱80,000', icon: <FaChartBar className="text-green-500" /> },
    { label: 'Total Expenses', value: '₱20,000', icon: <FaChartBar className="text-red-500" /> },
    { label: 'Profit', value: '₱20,000', icon: <FaChartBar className="text-purple-500" /> },
  ];
  const recentTransactions = [
    { id: 1, type: 'Sale', ref: 'SL_1001', date: '2024-06-01', amount: '₱10,000' },
    { id: 2, type: 'Purchase', ref: 'PR_1002', date: '2024-06-02', amount: '₱5,000' },
    { id: 3, type: 'Expense', ref: 'EX_1003', date: '2024-06-03', amount: '₱2,000' },
  ];

  return (
    <AdminLayout title="Reports" breadcrumb={<span>Dashboard &gt; <span className="text-gray-900">Reports</span></span>}>
      <div className="p-6">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Report Dashboard</h1>
          <div className="flex gap-2 items-center">
            <FaCalendarAlt className="text-gray-400" />
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={dateRange.from}
              onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
              aria-label="From date"
            />
            <span className="mx-1">to</span>
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={dateRange.to}
              onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
              aria-label="To date"
            />
            <button className="ml-2 border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-100 transition flex items-center gap-2" aria-label="Export CSV">
              <FaFileCsv /> Export CSV
            </button>
          </div>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summary.map((item) => (
            <ReportSummaryCard key={item.label} icon={item.icon} label={item.label} value={item.value} />
          ))}
        </div>
        {/* Placeholder Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 min-h-[250px] flex flex-col items-center justify-center">
            <div className="text-lg font-semibold mb-2">Sales Over Time</div>
            <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">[Bar Chart Placeholder]</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 min-h-[250px] flex flex-col items-center justify-center">
            <div className="text-lg font-semibold mb-2">Purchases Over Time</div>
            <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">[Line Chart Placeholder]</div>
          </div>
        </div>
        {/* Recent Transactions Table */}
        <div className="bg-white rounded-xl shadow p-0 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-semibold">Type</th>
                <th className="p-4 text-left font-semibold">Reference</th>
                <th className="p-4 text-left font-semibold">Date</th>
                <th className="p-4 text-left font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td className="p-6 text-center text-gray-400" colSpan={4}>No transactions found</td>
                </tr>
              ) : (
                recentTransactions.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{row.type}</td>
                    <td className="p-4">{row.ref}</td>
                    <td className="p-4">{row.date}</td>
                    <td className="p-4">{row.amount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Reports; 