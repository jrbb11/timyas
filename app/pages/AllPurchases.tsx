import AdminLayout from '../layouts/AdminLayout';
import { useEffect, useState } from 'react';
import { purchasesService } from '../services/purchasesService';
import { suppliersService } from '../services/suppliersService';
import { warehousesService } from '../services/warehousesService';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

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

  const filteredPurchases = purchases.filter((purchase) => {
    const searchTerm = search.toLowerCase();
    return (
      purchase.reference?.toLowerCase().includes(searchTerm) ||
      purchase.supplier_name?.toLowerCase().includes(searchTerm) ||
      purchase.warehouse_name?.toLowerCase().includes(searchTerm)
    );
  });

  // Pagination logic
  const paginatedPurchases = filteredPurchases.slice(
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

  return (
    <AdminLayout
      title="All Purchases"
      breadcrumb={<span>Purchases &gt; <span className="text-gray-900">All Purchases</span></span>}
    >
      <div className="py-6 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search this table"
              className="border rounded px-3 py-2 w-full max-w-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="border px-4 py-2 rounded text-gray-700 hover:bg-gray-50">Filter</button>
            <button className="border px-4 py-2 rounded text-green-600 border-green-400 hover:bg-green-50" onClick={handleExportPDF} type="button">PDF</button>
            <button className="border px-4 py-2 rounded text-red-600 border-red-400 hover:bg-red-50" onClick={handleExportExcel} type="button">EXCEL</button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" onClick={() => navigate('/purchases/create')} type="button">Create</button>
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={handleExportCSV} type="button">Export CSV</button>
          </div>
        </div>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-semibold"><input type="checkbox" /></th>
                  <th className="p-3 text-left font-semibold">Date</th>
                  <th className="p-3 text-left font-semibold">Reference</th>
                  <th className="p-3 text-left font-semibold">Supplier</th>
                  <th className="p-3 text-left font-semibold">Warehouse</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Grand Total</th>
                  <th className="p-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b hover:bg-gray-50">
                    <td className="p-3"><input type="checkbox" /></td>
                    <td className="p-3">{purchase.date}</td>
                    <td className="p-3 text-purple-600 hover:underline cursor-pointer" onClick={() => navigate(`/purchases/view/${purchase.id}`)}>{purchase.reference}</td>
                    <td className="p-3">{purchase.supplier_name}</td>
                    <td className="p-3">{purchase.warehouse_name}</td>
                    <td className="p-3"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{purchase.status}</span></td>
                    <td className="p-3">{Number(purchase.total_amount).toLocaleString()}</td>
                    <td className="p-3 text-center" style={{ minWidth: '110px', height: '100%' }}>
                      <div className="flex gap-2 items-center justify-center h-full">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleView(purchase)}
                          title="View"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-800"
                          onClick={() => handleEdit(purchase)}
                          title="Edit"
                          disabled={loadingAction}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
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
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <div>
            Rows per page:
            <select className="ml-2 border rounded px-2 py-1" value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(0); }}>
              {ROWS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            {startRow} - {endRow} of {totalRows}
            <button className="ml-4 px-2 py-1" disabled={currentPage === 0} onClick={() => setCurrentPage(p => Math.max(0, p - 1))}>prev</button>
            <button className="ml-2 px-2 py-1" disabled={endRow >= totalRows} onClick={() => setCurrentPage(p => p + 1)}>next</button>
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
  );
};

export default AllPurchases; 