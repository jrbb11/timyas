import AdminLayout from '../layouts/AdminLayout';
import { useEffect, useState } from 'react';
import { adjustmentBatchesService } from '../services/adjustmentBatchesService';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';

const AllStockAdjustments = () => {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewAdjustment, setViewAdjustment] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adjustmentToDelete, setAdjustmentToDelete] = useState<any | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    adjustmentBatchesService.getAll().then(({ data, error }) => {
      if (error) setError(error.message);
      else setAdjustments(data || []);
      setLoading(false);
    });
  }, []);

  const filteredAdjustments = adjustments.filter((adjustment) => {
    const searchTerm = search.toLowerCase();
    return (
      adjustment.reference_code?.toLowerCase().includes(searchTerm) ||
      adjustment.warehouse?.name?.toLowerCase().includes(searchTerm) ||
      adjustment.reason?.toLowerCase().includes(searchTerm)
    );
  });

  // Pagination logic
  const paginatedAdjustments = filteredAdjustments.slice(
    currentPage * rowsPerPage,
    currentPage * rowsPerPage + rowsPerPage
  );
  const totalRows = filteredAdjustments.length;
  const startRow = totalRows === 0 ? 0 : currentPage * rowsPerPage + 1;
  const endRow = Math.min((currentPage + 1) * rowsPerPage, totalRows);

  const handleExportPDF = () => {
    setToast({ message: 'PDF export not implemented yet', type: 'error' });
  };
  const handleExportExcel = () => {
    setToast({ message: 'Excel export not implemented yet', type: 'error' });
  };
  const handleEdit = (adjustment: any) => {
    navigate(`/products/stock-adjustments/edit/${adjustment.id}`);
  };
  const handleView = (adjustment: any) => {
    navigate(`/products/stock-adjustments/view/${adjustment.id}`);
  };
  const handleDelete = (adjustment: any) => {
    setAdjustmentToDelete(adjustment);
    setShowDeleteConfirm(true);
  };
  const confirmDelete = async () => {
    if (!adjustmentToDelete) return;
    setLoadingAction(true);
    try {
      const { error } = await adjustmentBatchesService.remove(adjustmentToDelete.id);
      if (error) throw error;
      setAdjustments(adjustments.filter(a => a.id !== adjustmentToDelete.id));
      setToast({ message: 'Stock adjustment deleted successfully', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
    setLoadingAction(false);
    setShowDeleteConfirm(false);
    setAdjustmentToDelete(null);
  };

  if (loading) {
    return (
      <AdminLayout title="Stock Adjustments">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Stock Adjustments"
      breadcrumb={<span>Products &gt; <span className="text-gray-900">Stock Adjustments</span></span>}
    >
      <div className="py-6 px-4">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {toast && (
          <div className={`mb-4 p-4 border rounded ${
            toast.type === 'success' 
              ? 'bg-green-100 border-green-400 text-green-700' 
              : 'bg-red-100 border-red-400 text-red-700'
          }`}>
            {toast.message}
          </div>
        )}

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
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Export Excel
            </button>
            <button
              onClick={() => navigate('/products/stock-adjustments/create')}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Create Adjustment
            </button>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left font-semibold">Reference</th>
                <th className="p-3 text-left font-semibold">Date</th>
                <th className="p-3 text-left font-semibold">Warehouse</th>
                <th className="p-3 text-left font-semibold">Reason</th>
                <th className="p-3 text-left font-semibold">Adjusted By</th>
                <th className="p-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAdjustments.length === 0 ? (
                <tr>
                  <td className="p-3 text-center text-gray-400" colSpan={6}>No stock adjustments found</td>
                </tr>
              ) : (
                paginatedAdjustments.map((adjustment) => (
                  <tr key={adjustment.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <span className="font-mono text-purple-600">{adjustment.reference_code}</span>
                    </td>
                    <td className="p-3">
                      {new Date(adjustment.adjusted_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {adjustment.warehouse?.name || 'N/A'}
                    </td>
                    <td className="p-3">
                      <span className="text-gray-600">{adjustment.reason || 'No reason provided'}</span>
                    </td>
                    <td className="p-3">
                      {adjustment.adjusted_by?.name || 'System'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleView(adjustment)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="View"
                        >
                          <FaEye size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(adjustment)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(adjustment)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Delete"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <div>
            Rows per page:
            <select 
              className="ml-2 border rounded px-2 py-1"
              value={rowsPerPage}
              onChange={e => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(0);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div>
            {startRow} - {endRow} of {totalRows}
            <button 
              className="ml-4 px-2 py-1" 
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              prev
            </button>
            <button 
              className="ml-2 px-2 py-1" 
              disabled={endRow >= totalRows}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              next
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Confirm Delete"
        >
          <div className="space-y-4">
            <p>Are you sure you want to delete this stock adjustment?</p>
            <p className="text-sm text-gray-600">
              Reference: <span className="font-mono">{adjustmentToDelete?.reference_code}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                disabled={loadingAction}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loadingAction ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AllStockAdjustments; 