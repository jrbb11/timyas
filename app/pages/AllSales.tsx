import AdminLayout from '../layouts/AdminLayout';
import { useEffect, useState, useRef } from 'react';
import { salesService } from '../services/salesService';
import { FaEye, FaEdit, FaTrash, FaTimesCircle, FaSearch, FaRegCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import { salePaymentsService } from '../services/salePaymentsService';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { accountsService } from '../services/accountsService';
import { paymentMethodsService } from '../services/paymentMethodsService';
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { supabase } from '../utils/supabaseClient';

declare module 'react-date-range';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const AllSales = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<any | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [viewSale, setViewSale] = useState<any | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentSale, setPaymentSale] = useState<any | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_method_id: '', account_id: '', payment_date: new Date().toISOString().slice(0,10), reference_number: '', note: '' });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<any>([
    { startDate: null, endDate: null, key: 'selection' },
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  useEffect(() => {
    setLoading(true);
    setError(null);
    salesService.getView().then(({ data, error }) => {
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setSales(data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    accountsService.getAll().then(({ data }) => setAccounts(data || []));
  }, []);

  useEffect(() => {
    paymentMethodsService.getAll().then(({ data }) => setPaymentMethods(data || []));
  }, []);

  useEffect(() => {
    if (!showDatePicker) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedSales = [...sales].sort((a, b) => {
    const { key, direction } = sortConfig;
    let aValue = a[key];
    let bValue = b[key];
    if (key === 'customer_name') {
      aValue = aValue?.toLowerCase() || '';
      bValue = bValue?.toLowerCase() || '';
    }
    if (key === 'total_amount') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }
    if (key === 'date') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredSales = sortedSales.filter((sale) => {
    const searchTerm = search.toLowerCase();
    const matchesSearch =
      sale.reference?.toLowerCase().includes(searchTerm) ||
      sale.invoice_number?.toLowerCase().includes(searchTerm) ||
      sale.customer?.toLowerCase().includes(searchTerm) ||
      sale.warehouse_name?.toLowerCase().includes(searchTerm);
    let matchesDate = true;
    if (dateRange[0].startDate && dateRange[0].endDate) {
      const saleDate = new Date(sale.date);
      matchesDate =
        saleDate >= dateRange[0].startDate &&
        saleDate <= dateRange[0].endDate;
    }
    return matchesSearch && matchesDate;
  });

  // Pagination logic
  const paginatedSales = filteredSales.slice(
    currentPage * rowsPerPage,
    currentPage * rowsPerPage + rowsPerPage
  );
  const totalRows = filteredSales.length;
  const startRow = totalRows === 0 ? 0 : currentPage * rowsPerPage + 1;
  const endRow = Math.min((currentPage + 1) * rowsPerPage, totalRows);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["ID", "Reference", "Invoice", "Date", "Customer", "Warehouse", "Status", "Payment Status", "Grand Total", "Shipping Fee", "Total", "Created At"]],
      body: filteredSales.map(({ id, reference, invoice_number, date, customer, warehouse_name, status, payment_status, total_amount, shipping, created_at }) => [id, reference, invoice_number, date, customer, warehouse_name, status, payment_status, Number(total_amount - (shipping || 0)).toLocaleString(), Number(shipping || 0).toLocaleString(), Number(total_amount).toLocaleString(), created_at]),
    });
    doc.save('sales.pdf');
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredSales.map(({ id, reference, invoice_number, date, customer, warehouse_name, status, payment_status, total_amount, shipping, created_at }) => ({ id, reference, invoice_number, date, customer, warehouse_name, status, payment_status, grand_total: Number(total_amount - (shipping || 0)), shipping_fee: Number(shipping || 0), total: Number(total_amount), created_at })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, 'sales.xlsx');
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredSales.map(({ id, reference, invoice_number, date, customer, warehouse_name, status, payment_status, total_amount, shipping, created_at }) => ({ id, reference, invoice_number, date, customer, warehouse_name, status, payment_status, grand_total: Number(total_amount - (shipping || 0)), shipping_fee: Number(shipping || 0), total: Number(total_amount), created_at })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sales.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSelectedSales = () => {
    const selectedSales = sales.filter(s => selected.includes(s.id));
    const csv = Papa.unparse(selectedSales.map(({ id, reference, invoice_number, date, customer, warehouse_name, status, payment_status, total_amount, shipping, created_at }) => ({ id, reference, invoice_number, date, customer, warehouse_name, status, payment_status, grand_total: Number(total_amount - (shipping || 0)), shipping_fee: Number(shipping || 0), total: Number(total_amount), created_at })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'selected_sales.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (sale: any) => {
    navigate(`/sales/edit/${sale.id}`);
  };

  const handleView = (sale: any) => {
    setViewSale(sale);
  };

  const handleDelete = async () => {
    if (!saleToDelete) return;
    setLoadingAction(true);
    // Update the sale's status to 'cancel'
    const { error } = await salesService.update(saleToDelete.id, { status: 'cancel' });
    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setToast({ message: 'Sale cancelled', type: 'success' });
      // Refresh the sales list
      salesService.getView().then(({ data, error }) => {
        if (!error) setSales(data || []);
      });
    }
    setShowDeleteConfirm(false);
    setSaleToDelete(null);
    setLoadingAction(false);
  };

  const openPaymentModal = (sale: any) => {
    setPaymentSale(sale);
    setPaymentForm({
      amount: sale.due || sale.total_amount,
      payment_method_id: paymentMethods[0]?.id || '',
      account_id: accounts[0]?.id || '',
      payment_date: new Date().toISOString().slice(0,10),
      reference_number: '',
      note: ''
    });
    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => setPaymentModalOpen(false);

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentSale) return;
    setPaymentLoading(true);
    const { error } = await salePaymentsService.create({
      sale_id: paymentSale.id,
      amount: Number(paymentForm.amount),
      payment_method_id: paymentForm.payment_method_id,
      account_id: paymentForm.account_id,
      payment_date: paymentForm.payment_date,
      reference_number: paymentForm.reference_number,
      note: paymentForm.note,
    });
    setPaymentLoading(false);
    if (error) {
      setToast({ message: error.message, type: 'error' });
      return;
    }
    setPaymentModalOpen(false);
    salesService.getView().then(({ data, error }) => {
      if (!error) setSales(data || []);
    });
    setToast({ message: 'Payment recorded', type: 'success' });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(paginatedSales.map(s => s.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectRow = (id: any) => {
    setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <AdminLayout
      title="All Sales"
      breadcrumb={<span>Sales &gt; <span className="text-gray-900">All Sales</span></span>}
    >
      <div className="py-6 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex-1 flex gap-2 items-center">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search for sales"
                className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg w-full text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ boxShadow: 'none' }}
              />
            </div>
            <div className="relative" ref={datePickerRef}>
              <button
                className="border px-4 py-2 rounded-lg flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-100 transition"
                onClick={() => setShowDatePicker(v => !v)}
                type="button"
              >
                <FaRegCalendarAlt />
                {dateRange[0].startDate && dateRange[0].endDate
                  ? `${format(dateRange[0].startDate, 'MMM d, yyyy')} – ${format(dateRange[0].endDate, 'MMM d, yyyy')}`
                  : 'Select date range'}
              </button>
              {showDatePicker && (
                <div className="absolute z-50 mt-2 bg-white rounded shadow-lg p-2">
                  <DateRange
                    editableDateInputs={true}
                    onChange={(item: any) => setDateRange([item.selection])}
                    moveRangeOnFirstSelection={false}
                    ranges={dateRange}
                    maxDate={new Date()}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      className="text-xs text-gray-500 hover:text-black px-2 py-1 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 transition"
                      onClick={() => { setDateRange([{ startDate: null, endDate: null, key: 'selection' }]); setShowDatePicker(false); }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
            <button className="border border-gray-300 text-gray-700 bg-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-100 transition" onClick={handleExportCSV} type="button">Export Sales</button>
            <button className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-gray-900 transition ml-auto" style={{minWidth: 120}} onClick={() => navigate('/sales/create')} type="button">+ Create</button>
          </div>
        </div>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b text-gray-700 text-base">
                  <th className="p-4 text-left font-semibold"><input type="checkbox" checked={selected.length === paginatedSales.length && paginatedSales.length > 0} onChange={handleSelectAll} /></th>
                  <th className="p-4 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('date')}>
                    Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-4 text-left font-semibold">Reference</th>
                  <th className="p-4 text-left font-semibold">Invoice</th>
                  <th className="p-4 text-left font-semibold">Customer</th>
                  <th className="p-4 text-left font-semibold">Branch</th>
                  <th className="p-4 text-left font-semibold">Warehouse</th>
                  <th className="p-4 text-left font-semibold">Status</th>
                  <th className="p-4 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('total_amount')}>
                    Grand Total {sortConfig.key === 'total_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-4 text-left font-semibold">Shipping Fee</th>
                  <th className="p-4 text-left font-semibold">Paid</th>
                  <th className="p-4 text-left font-semibold">Due</th>
                  <th className="p-4 text-left font-semibold">Payment Status</th>
                  <th className="p-4 text-center font-semibold" style={{ width: '110px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.map((sale) => (
                  <tr key={sale.id} className={`border-b hover:bg-gray-50 transition ${selected.includes(sale.id) ? 'bg-blue-50' : ''}`}>
                    <td className="p-4"><input type="checkbox" checked={selected.includes(sale.id)} onChange={() => handleSelectRow(sale.id)} /></td>
                    <td className="p-4 font-medium">{sale.date}</td>
                    <td className="p-4 text-purple-600 hover:underline cursor-pointer">{sale.reference}</td>
                    <td className="p-4">{sale.invoice_number}</td>
                    <td className="p-4">{sale.customer}</td>
                    <td className="p-4">{sale.branch}</td>
                    <td className="p-4">{sale.warehouse_name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${sale.status === 'delivered' ? 'bg-green-50 text-green-600' : sale.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : sale.status === 'cancel' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}>{sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}</span>
                    </td>
                    <td className="p-4 font-semibold">{Number(sale.total_amount - (sale.shipping || 0)).toLocaleString()}</td>
                    <td className="p-4">{Number(sale.shipping || 0).toLocaleString()}</td>
                    <td className="p-4">{Number(sale.paid || 0).toLocaleString()}</td>
                    <td className="p-4">{Number(sale.due || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${sale.payment_status === 'paid' ? 'bg-green-50 text-green-600' : sale.payment_status === 'partial' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>{sale.payment_status.charAt(0).toUpperCase() + sale.payment_status.slice(1)}</span>
                    </td>
                    <td className="p-4 text-center" style={{ minWidth: '110px', height: '100%' }}>
                      <div className="flex gap-2 items-center justify-center h-full">
                        <button className="text-gray-500 hover:text-blue-600 p-2 rounded-full transition" onClick={() => handleView(sale)} title="View"><FaEye /></button>
                        <button className="text-gray-500 hover:text-green-600 p-2 rounded-full transition" onClick={() => handleEdit(sale)} title="Edit" disabled={loadingAction}><FaEdit /></button>
                        <button className="text-gray-500 hover:text-red-600 p-2 rounded-full transition" onClick={() => { setSaleToDelete(sale); setShowDeleteConfirm(true); }} title="Delete" disabled={loadingAction}><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex items-center justify-between mt-6 text-base text-gray-600">
          <div className="flex items-center gap-4">
            <label className="text-gray-600 text-sm" htmlFor="rowsPerPage">Rows:</label>
            <select
              id="rowsPerPage"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black bg-white"
              value={rowsPerPage}
              onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(0); }}
              style={{ minWidth: 70 }}
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>Showing <span className="font-semibold text-gray-900">{startRow}-{endRow}</span> of <span className="font-semibold text-gray-900">{totalRows}</span> entries</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>Previous</button>
            <span className="font-semibold text-gray-900">{currentPage + 1}</span>
            <button className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100" onClick={() => setCurrentPage(p => p + 1)} disabled={endRow >= totalRows}>Next</button>
          </div>
        </div>
      </div>
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setSaleToDelete(null); }}
        title="Cancel Sale"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
              onClick={() => { setShowDeleteConfirm(false); setSaleToDelete(null); }}
              disabled={loadingAction}
            >
              Back
            </button>
            <button
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              onClick={handleDelete}
              disabled={loadingAction}
            >
              {loadingAction ? 'Cancelling...' : 'Cancel Sale'}
            </button>
          </div>
        }
      >
        <p>Are you sure you want to cancel this sale?</p>
        <p className="font-semibold mt-2">{saleToDelete?.reference}</p>
      </Modal>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
      {/* Sale View Modal */}
      {viewSale && (
        <Modal
          isOpen={!!viewSale}
          onClose={() => setViewSale(null)}
          title="Sale Details"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div><span className="font-medium text-gray-500">Reference:</span> <span className="font-semibold text-gray-900">{viewSale.reference}</span></div>
            <div><span className="font-medium text-gray-500">Invoice:</span> <span className="font-semibold text-gray-900">{viewSale.invoice_number}</span></div>
            <div><span className="font-medium text-gray-500">Customer:</span> <span className="font-semibold text-gray-900">{viewSale.customer}</span></div>
            <div><span className="font-medium text-gray-500">Branch:</span> <span className="font-semibold text-gray-900">{viewSale.branch}</span></div>
            <div><span className="font-medium text-gray-500">Warehouse:</span> <span className="font-semibold text-gray-900">{viewSale.warehouse_name}</span></div>
            <div><span className="font-medium text-gray-500">Status:</span> <span className="font-semibold text-gray-900">{viewSale.status}</span></div>
            <div><span className="font-medium text-gray-500">Payment Status:</span> <span className="font-semibold text-gray-900">{viewSale.payment_status}</span></div>
            <div><span className="font-medium text-gray-500">Total:</span> <span className="font-semibold text-gray-900">{Number(viewSale.total_amount).toLocaleString()}</span></div>
            <div><span className="font-medium text-gray-500">Shipping Fee:</span> <span className="font-semibold text-gray-900">{Number(viewSale.shipping || 0).toLocaleString()}</span></div>
            <div><span className="font-medium text-gray-500">Paid:</span> <span className="font-semibold text-gray-900">{Number(viewSale.paid || 0).toLocaleString()}</span></div>
            <div><span className="font-medium text-gray-500">Due:</span> <span className="font-semibold text-gray-900">{Number(viewSale.due || 0).toLocaleString()}</span></div>
          </div>
          <button className="mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200" onClick={() => setViewSale(null)}>Close</button>
        </Modal>
      )}
      {paymentModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
            <h2 className="text-2xl font-bold mb-6">Process Payment</h2>
            <form onSubmit={handlePaymentSubmit} className="space-y-5">
              <div>
                <label className="block mb-1 font-medium text-gray-700">Amount</label>
                <input name="amount" type="number" value={paymentForm.amount} onChange={handlePaymentChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" required min="0.01" step="0.01" />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">Payment Method</label>
                <select name="payment_method_id" value={paymentForm.payment_method_id} onChange={handlePaymentChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black">
                  {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">Account</label>
                <select name="account_id" value={paymentForm.account_id} onChange={handlePaymentChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black">
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">Date</label>
                <input name="payment_date" type="date" value={paymentForm.payment_date} onChange={handlePaymentChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" required />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">Reference/Note</label>
                <input name="reference_number" value={paymentForm.reference_number} onChange={handlePaymentChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" placeholder="Reference or note (optional)" />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button type="button" className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold" onClick={closePaymentModal} disabled={paymentLoading}>Cancel</button>
                <button type="submit" className="bg-black text-white font-semibold rounded-lg px-4 py-2" disabled={paymentLoading}>{paymentLoading ? 'Saving...' : 'Save Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex gap-4 items-center border z-50">
          <span className="font-semibold text-gray-700">{selected.length} selected</span>
          <button className="text-gray-700 hover:text-gray-900 font-semibold" onClick={handleExportSelectedSales}>Export Sales</button>
        </div>
      )}
    </AdminLayout>
  );
};

export default AllSales; 