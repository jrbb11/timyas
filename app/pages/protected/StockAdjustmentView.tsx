import AdminLayout from '../../layouts/AdminLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { adjustmentBatchesService } from '../../services/adjustmentBatchesService';
import { productAdjustmentsService } from '../../services/productAdjustmentsService';

const StockAdjustmentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [adjustment, setAdjustment] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      adjustmentBatchesService.getById(id as string),
      productAdjustmentsService.getByBatchId(id as string),
    ]).then(([adjustmentRes, itemsRes]) => {
      if (adjustmentRes.error) setError(adjustmentRes.error.message);
      else {
        setAdjustment(adjustmentRes.data);
        setItems(itemsRes.data || []);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <AdminLayout title="Stock Adjustment Details">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Stock Adjustment Details">
        <div className="p-6">
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!adjustment) {
    return (
      <AdminLayout title="Stock Adjustment Details">
        <div className="p-6">
          <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            Stock adjustment not found
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Stock Adjustment Details"
      breadcrumb={<span>Products &gt; Stock Adjustments &gt; <span className="text-gray-900">View</span></span>}
    >
      <div className="py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Stock Adjustment: {adjustment.reference_code}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/products/stock-adjustments/edit/${adjustment.id}`)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Edit
            </button>
            <button
              onClick={() => navigate('/products/stock-adjustments')}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Back to List
            </button>
          </div>
        </div>

        {/* Adjustment Details */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-4">Adjustment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Reference Code</label>
                <p className="text-lg font-mono text-purple-600">{adjustment.reference_code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Date</label>
                <p className="text-lg">{new Date(adjustment.adjusted_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Warehouse</label>
                <p className="text-lg">{adjustment.warehouse?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Adjusted By</label>
                <p className="text-lg">{adjustment.adjusted_by?.name || 'System'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600">Reason</label>
                <p className="text-lg">{adjustment.reason || 'No reason provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Adjustment Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-4">Adjustment Items</h2>
            {items.length === 0 ? (
              <p className="text-gray-500">No items found for this adjustment</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left font-semibold">Product</th>
                      <th className="p-3 text-left font-semibold">Type</th>
                      <th className="p-3 text-left font-semibold">Quantity</th>
                      <th className="p-3 text-left font-semibold">Before Stock</th>
                      <th className="p-3 text-left font-semibold">After Stock</th>
                      <th className="p-3 text-left font-semibold">Adjusted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-bold text-green-700">{item.product?.code}</div>
                            <div className="text-sm text-gray-600">{item.product?.name}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            item.type === 'addition' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.type === 'addition' ? 'Addition' : 'Subtraction'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold">{item.quantity}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-gray-600">{item.before_stock}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-blue-600">{item.after_stock}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-gray-500">
                            {new Date(item.adjusted_at).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {items.filter(item => item.type === 'addition').length}
                </div>
                <div className="text-sm text-gray-600">Additions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {items.filter(item => item.type === 'subtraction').length}
                </div>
                <div className="text-sm text-gray-600">Subtractions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {items.length}
                </div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default StockAdjustmentView; 