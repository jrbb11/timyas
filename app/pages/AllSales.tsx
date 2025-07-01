import AdminLayout from '../layouts/AdminLayout';
import { useEffect, useState } from 'react';
import { salesService } from '../services/salesService';
import { FaEye, FaEdit, FaTrash, FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

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
  const navigate = useNavigate();

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

  const filteredSales = sales.filter((sale) => {
    const searchTerm = search.toLowerCase();
    return (
      sale.reference?.toLowerCase().includes(searchTerm) ||
      sale.invoice_number?.toLowerCase().includes(searchTerm) ||
      sale.customer_name?.toLowerCase().includes(searchTerm) ||
      sale.warehouse_name?.toLowerCase().includes(searchTerm)
    );
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
    // TODO: Implement PDF export logic for sales
    setToast({ message: 'PDF export not implemented yet', type: 'error' });
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export logic for sales
    setToast({ message: 'Excel export not implemented yet', type: 'error' });
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
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" onClick={() => navigate('/sales/create')} type="button">Create</button>
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
                  <th className="p-3 text-left font-semibold">Invoice</th>
                  <th className="p-3 text-left font-semibold">Customer</th>
                  <th className="p-3 text-left font-semibold">Warehouse</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Grand Total</th>
                  <th className="p-3 text-left font-semibold">Paid</th>
                  <th className="p-3 text-left font-semibold">Due</th>
                  <th className="p-3 text-left font-semibold">Payment Status</th>
                  <th className="p-3 text-center font-semibold" style={{ width: '110px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="p-3"><input type="checkbox" /></td>
                    <td className="p-3">{sale.date}</td>
                    <td className="p-3 text-purple-600 hover:underline cursor-pointer">{sale.reference}</td>
                    <td className="p-3">{sale.invoice_number}</td>
                    <td className="p-3">{sale.customer_name}</td>
                    <td className="p-3">{sale.warehouse_name}</td>
                    <td className="p-3">
                      {sale.status === 'cancel' ? (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">cancelled</span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{sale.status}</span>
                      )}
                    </td>
                    <td className="p-3">{Number(sale.total_amount).toLocaleString()}</td>
                    <td className="p-3">{Number(sale.paid || 0).toLocaleString()}</td>
                    <td className="p-3">{Number(sale.due || 0).toLocaleString()}</td>
                    <td className="p-3"><span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">{sale.payment_status}</span></td>
                    <td className="p-3" style={{ minWidth: '110px', height: '100%' }}>
                      <div className="flex gap-2 items-center justify-center h-full">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleView(sale)}
                          title="View"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-800"
                          onClick={() => handleEdit(sale)}
                          title="Edit"
                          disabled={loadingAction}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => { setSaleToDelete(sale); setShowDeleteConfirm(true); }}
                          title="Cancel"
                          disabled={loadingAction}
                        >
                          <FaTimesCircle />
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
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div>
            {startRow} - {endRow} of {totalRows}
            <button className="ml-4 px-2 py-1" disabled={currentPage === 0} onClick={() => setCurrentPage(p => Math.max(0, p - 1))}>prev</button>
            <button className="ml-2 px-2 py-1" disabled={endRow >= totalRows} onClick={() => setCurrentPage(p => p + 1)}>next</button>
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
            <div><span className="font-medium text-gray-500">Customer:</span> <span className="font-semibold text-gray-900">{viewSale.customer_name}</span></div>
            <div><span className="font-medium text-gray-500">Warehouse:</span> <span className="font-semibold text-gray-900">{viewSale.warehouse_name}</span></div>
            <div><span className="font-medium text-gray-500">Status:</span> <span className="font-semibold text-gray-900">{viewSale.status}</span></div>
            <div><span className="font-medium text-gray-500">Payment Status:</span> <span className="font-semibold text-gray-900">{viewSale.payment_status}</span></div>
            <div><span className="font-medium text-gray-500">Total:</span> <span className="font-semibold text-gray-900">{Number(viewSale.total_amount).toLocaleString()}</span></div>
            <div><span className="font-medium text-gray-500">Paid:</span> <span className="font-semibold text-gray-900">{Number(viewSale.paid || 0).toLocaleString()}</span></div>
            <div><span className="font-medium text-gray-500">Due:</span> <span className="font-semibold text-gray-900">{Number(viewSale.due || 0).toLocaleString()}</span></div>
          </div>
          <button className="mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200" onClick={() => setViewSale(null)}>Close</button>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default AllSales; 