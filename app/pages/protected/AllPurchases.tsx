// @ts-ignore
// eslint-disable-next-line
declare module 'react-date-range';
import AdminLayout from '../../layouts/AdminLayout';
import { useEffect, useState, useRef } from 'react';
import { purchasesService } from '../../services/purchasesService';
import { suppliersService } from '../../services/suppliersService';
import { warehousesService } from '../../services/warehousesService';
import { FaEye, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/Modal';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';
import { FaRegCalendarAlt } from 'react-icons/fa';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const AllPurchases = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewPurchase, setViewPurchase] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<any | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [selected, setSelected] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<any>([
    {
      startDate: null,
      endDate: null,
      key: 'selection',
    },
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      purchasesService.getAll(),
      suppliersService.getAll(),
      warehousesService.getAll(),
    ]).then(([{ data: purchases, error }, { data: suppliers }, { data: warehouses }]) => {
      if (error) setError(error.message);
      else {
        setSuppliers(suppliers || []);
        setWarehouses(warehouses || []);
        setPurchases((purchases || []).map((p: any) => ({
          ...p,
          supplier_name: suppliers?.find((s: any) => s.id === p.supplier)?.name || '',
          warehouse_name: warehouses?.find((w: any) => w.id === p.warehouse)?.name || '',
        })));
      }
      setLoading(false);
    });
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

  const filteredPurchases = purchases.filter((purchase) => {
    const searchTerm = search.toLowerCase();
    const matchesSearch =
      purchase.reference?.toLowerCase().includes(searchTerm) ||
      purchase.supplier_name?.toLowerCase().includes(searchTerm) ||
      purchase.warehouse_name?.toLowerCase().includes(searchTerm);
    let matchesDate = true;
    if (dateRange[0].startDate && dateRange[0].endDate) {
      const purchaseDate = new Date(purchase.date);
      matchesDate =
        purchaseDate >= dateRange[0].startDate &&
        purchaseDate <= dateRange[0].endDate;
    }
    return matchesSearch && matchesDate;
  });

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedPurchases = [...purchases].sort((a, b) => {
    const { key, direction } = sortConfig;
    let aValue = a[key];
    let bValue = b[key];
    if (key === 'supplier_name') {
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

  const paginatedPurchases = sortedPurchases.slice(
    currentPage * rowsPerPage,
    currentPage * rowsPerPage + rowsPerPage
  );
  const totalRows = filteredPurchases.length;
  const startRow = totalRows === 0 ? 0 : currentPage * rowsPerPage + 1;
  const endRow = Math.min((currentPage + 1) * rowsPerPage, totalRows);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["ID", "Reference", "Date", "Supplier", "Warehouse", "Status", "Payment Status", "Total", "Created At"]],
      body: filteredPurchases.map(({ id, reference, date, supplier_name, warehouse_name, status, payment_status, total_amount, created_at }) => [id, reference, date, supplier_name, warehouse_name, status, payment_status, total_amount, created_at]),
    });
    doc.save('purchases.pdf');
  };
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredPurchases.map(({ id, reference, date, supplier_name, warehouse_name, status, payment_status, total_amount, created_at }) => ({ id, reference, date, supplier_name, warehouse_name, status, payment_status, total_amount, created_at })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchases');
    XLSX.writeFile(wb, 'purchases.xlsx');
  };
  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredPurchases.map(({ id, reference, date, supplier_name, warehouse_name, status, payment_status, total_amount, created_at }) => ({ id, reference, date, supplier_name, warehouse_name, status, payment_status, total_amount, created_at })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'purchases.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleExportSelectedPurchases = () => {
    const selectedPurchases = purchases.filter(p => selected.includes(p.id));
    const csv = Papa.unparse(selectedPurchases.map(({ id, reference, date, supplier_name, warehouse_name, status, payment_status, total_amount, created_at }) => ({ id, reference, date, supplier_name, warehouse_name, status, payment_status, total_amount, created_at })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'selected_purchases.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleEdit = (purchase: any) => {
    navigate(`/purchases/edit/${purchase.id}`);
  };
  const handleView = (purchase: any) => {
    navigate(`/purchases/view/${purchase.id}`);
  };
  const handleDelete = async () => {
    if (!purchaseToDelete) return;
    setLoadingAction(true);
    // TODO: Implement delete logic for purchases
    setTimeout(() => {
      setToast({ message: 'Purchase deleted (stub)', type: 'success' });
      setShowDeleteConfirm(false);
      setPurchaseToDelete(null);
      setLoadingAction(false);
    }, 1000);
  };
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(paginatedPurchases.map(p => p.id));
    } else {
      setSelected([]);
    }
  };
  const handleSelectRow = (id: any) => {
    setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  // Add a helper for supplier avatar/initials
  const getInitials = (name: string) => name ? name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminLayout
        title="All Purchases"
        breadcrumb={<span>Purchases &gt; <span className="text-gray-900">All Purchases</span></span>}
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
                  placeholder="Search for purchases"
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
                  <div className="absolute z-50 mt-2 bg-white rounded shadow-lg p-2" ref={datePickerRef}>
                    <DateRange
                      editableDateInputs={true}
                      onChange={item => setDateRange([item.selection])}
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
              <button className="border border-gray-300 text-gray-700 bg-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-100 transition" onClick={handleExportCSV} type="button">Export Purchases</button>
              <button className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-gray-900 transition ml-auto" style={{minWidth: 120}} onClick={() => navigate('/purchases/create')} type="button">+ Create</button>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-0 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b text-gray-700 text-base">
                    <th className="p-4 text-left font-semibold"><input type="checkbox" checked={selected.length === paginatedPurchases.length && paginatedPurchases.length > 0} onChange={handleSelectAll} /></th>
                    <th className="p-4 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('date')}>
                      Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-4 text-left font-semibold">Reference</th>
                    <th className="p-4 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('supplier_name')}>
                      Supplier {sortConfig.key === 'supplier_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-4 text-left font-semibold">Warehouse</th>
                    <th className="p-4 text-left font-semibold cursor-pointer" onClick={() => handleSort('status')}>Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-4 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('total_amount')}>
                      Grand Total {sortConfig.key === 'total_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-4 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPurchases.map((purchase) => (
                    <tr key={purchase.id} className={`border-b hover:bg-gray-50 transition ${selected.includes(purchase.id) ? 'bg-blue-50' : ''}`}>
                      <td className="p-4"><input type="checkbox" checked={selected.includes(purchase.id)} onChange={() => handleSelectRow(purchase.id)} /></td>
                      <td className="p-4 font-medium">{purchase.date}</td>
                      <td className="p-4 text-purple-600 hover:underline cursor-pointer" onClick={() => handleView(purchase)}>{purchase.reference}</td>
                      <td className="p-4 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold text-base">
                          {getInitials(purchase.supplier_name)}
                        </span>
                        <span className="font-medium">{purchase.supplier_name}</span>
                      </td>
                      <td className="p-4">{purchase.warehouse_name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${purchase.status === 'received' ? 'bg-green-50 text-green-600' : purchase.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : purchase.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}>{purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}</span>
                      </td>
                      <td className="p-4 font-semibold">{Number(purchase.total_amount).toLocaleString()}</td>
                      <td className="p-4 text-center" style={{ minWidth: '110px', height: '100%' }}>
                        <div className="flex gap-2 items-center justify-center h-full">
                          <button
                            className="text-gray-500 hover:text-blue-600 p-2 rounded-full transition"
                            onClick={() => handleView(purchase)}
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="text-gray-500 hover:text-green-600 p-2 rounded-full transition"
                            onClick={() => handleEdit(purchase)}
                            title="Edit"
                            disabled={loadingAction}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="text-gray-500 hover:text-red-600 p-2 rounded-full transition"
                            onClick={() => { setPurchaseToDelete(purchase); setShowDeleteConfirm(true); }}
                            title="Delete"
                            disabled={loadingAction}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {/* Floating Action Bar for Bulk Actions */}
            {selected.length > 0 && (
              <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex gap-4 items-center border z-50">
                <span className="font-semibold text-gray-700">{selected.length} selected</span>
                <button
                  className="text-gray-700 hover:text-gray-900 font-semibold"
                  onClick={() => handleExportSelectedPurchases()}
                >
                  Export Purchases
                </button>
              </div>
            )}
          </div>
          {/* Pagination and Entry Count */}
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
              <button
                className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </button>
              <span className="font-semibold text-gray-900">{currentPage + 1}</span>
              <button
                className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={endRow >= totalRows}
              >
                Next
              </button>
            </div>
          </div>
          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={showDeleteConfirm}
            onClose={() => { setShowDeleteConfirm(false); setPurchaseToDelete(null); }}
            title="Delete Purchase"
            footer={
              <div className="flex justify-end gap-2">
                <button
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                  onClick={() => { setShowDeleteConfirm(false); setPurchaseToDelete(null); }}
                  disabled={loadingAction}
                >
                  Cancel
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={loadingAction}
                >
                  {loadingAction ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            }
          >
            <p>Are you sure you want to delete this purchase?</p>
            <p className="font-semibold mt-2">{purchaseToDelete?.reference}</p>
          </Modal>
          {/* Toast Notification */}
          {toast && (
            <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
              {toast.message}
            </div>
          )}
        </div>
      </AdminLayout>
    </div>
  );
};

export default AllPurchases;
