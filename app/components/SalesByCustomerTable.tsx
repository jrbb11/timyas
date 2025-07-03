import React, { useEffect, useState } from 'react';
import { getSalesByCustomer } from '../services/salesService';
import type { SalesByCustomer } from '../services/salesService';

export default function SalesByCustomerTable() {
  const [rows, setRows] = useState<SalesByCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 10;

  useEffect(() => {
    getSalesByCustomer()
      .then((data) => setRows(data))
      .finally(() => setLoading(false));
  }, []);

  const pagedRows = rows.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);
  const totalPages = Math.ceil(rows.length / rowsPerPage);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-xl shadow">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Customer</th>
            <th className="px-4 py-2 text-right">Total Sales</th>
            <th className="px-4 py-2 text-right">Total Paid</th>
            <th className="px-4 py-2 text-right">Total Due</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row) => (
            <tr key={row.customer}>
              <td className="px-4 py-2">{row.customer}</td>
              <td className="px-4 py-2 text-right">{row.total_sales.toLocaleString()}</td>
              <td className="px-4 py-2 text-right">{row.total_paid.toLocaleString()}</td>
              <td className="px-4 py-2 text-right">{row.total_due.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end items-center gap-2 mt-2">
        <button
          disabled={currentPage === 0}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          disabled={currentPage + 1 >= totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
} 