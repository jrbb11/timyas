import React, { useEffect, useState } from 'react';
import { getSalesByCustomer } from '../services/salesService';
import type { SalesByCustomer } from '../services/salesService';
import { supabase } from '../utils/supabaseClient';

interface SalesByCustomerTableProps {
  filterValue?: string;
  filterType?: 'day' | 'week' | 'month' | 'year';
}

export default function SalesByCustomerTable(props: SalesByCustomerTableProps = {}) {
  const { filterValue, filterType = 'month' } = props;
  const [rows, setRows] = useState<SalesByCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 10;

  useEffect(() => {
    // If filterValue is provided, filter by date range
    if (filterValue) {
      let dateFilter: { gte?: string; lte?: string } = {};
      
      if (filterType === 'month') {
        const [year, month] = filterValue.split('-');
        const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
        dateFilter = {
          gte: `${year}-${month}-01`,
          lte: `${year}-${month}-${daysInMonth.toString().padStart(2, '0')}`
        };
      } else if (filterType === 'day') {
        dateFilter = { gte: filterValue, lte: filterValue };
      } else if (filterType === 'year') {
        dateFilter = {
          gte: `${filterValue}-01-01`,
          lte: `${filterValue}-12-31`
        };
      }
      
      // Query sales_view with date filter
      supabase
        .from('sales_view')
        .select('customer, total_amount, paid, due, shipping, date')
        .neq('customer', null)
        .gte('date', dateFilter.gte || '1900-01-01')
        .lte('date', dateFilter.lte || '9999-12-31')
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching sales:', error);
            setRows([]);
            setLoading(false);
            return;
          }
          
          // Group by customer
          const grouped: { [key: string]: SalesByCustomer } = {};
          (data || []).forEach((row: any) => {
            if (!grouped[row.customer]) {
              grouped[row.customer] = { customer: row.customer, total_sales: 0, total_paid: 0, total_due: 0 };
            }
            const totalAmount = Number(row.total_amount) || 0;
            const shipping = Number(row.shipping) || 0;
            const paid = Number(row.paid) || 0;
            const due = Number(row.due) || 0;
            
            // Calculate sales excluding shipping
            const salesAmount = totalAmount - shipping;
            
            // Adjust paid and due to exclude shipping proportionally
            // If total_amount > 0, calculate the ratio
            let adjustedPaid = 0;
            let adjustedDue = 0;
            
            if (totalAmount > 0) {
              // Ratio of paid to total_amount
              const paidRatio = paid / totalAmount;
              // Apply same ratio to sales amount (excluding shipping)
              adjustedPaid = salesAmount * paidRatio;
              // Due is the remaining amount
              adjustedDue = salesAmount - adjustedPaid;
            } else {
              adjustedPaid = 0;
              adjustedDue = 0;
            }
            
            grouped[row.customer].total_sales += salesAmount;
            grouped[row.customer].total_paid += adjustedPaid;
            grouped[row.customer].total_due += adjustedDue;
          });
          
          setRows(Object.values(grouped).sort((a, b) => b.total_sales - a.total_sales));
          setLoading(false);
        });
    } else {
      // No filter, get all sales
      getSalesByCustomer()
        .then((data) => setRows(data))
        .finally(() => setLoading(false));
    }
  }, [filterValue, filterType]);

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