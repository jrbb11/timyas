import AdminLayout from '../layouts/AdminLayout';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { warehousesService } from '../services/warehousesService';
import { productsService } from '../services/productsService';
import { adjustmentBatchesService } from '../services/adjustmentBatchesService';
import { productAdjustmentsService } from '../services/productAdjustmentsService';
import { warehouseStockService } from '../services/warehouseStockService';
import { FaEdit, FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import Modal from '../components/ui/Modal';

const CreateStockAdjustment = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [currentStocks, setCurrentStocks] = useState<any>({});
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [reference, setReference] = useState('');
  const [date, setDate] = useState('');

  // Product search and adjustment items state
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [adjustmentItems, setAdjustmentItems] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [reason, setReason] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItemIdx, setEditItemIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Set initial date after mount to avoid hydration mismatch
  useEffect(() => {
    if (!date) {
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [date]);

  // Fetch all dropdown data
  useEffect(() => {
    warehousesService.getAll().then(({ data }) => {
      setWarehouses(data || []);
      setLoadingWarehouses(false);
    });
    Promise.all([
      productsService.getAll(),
      productsService.getStockView(),
    ]).then(([{ data: products }, { data: stockData }]) => {
      setProducts(products || []);
      const stockMap = Object.fromEntries((stockData || []).map(s => [s.id, s.stock]));
      setCurrentStocks(stockMap);
      setLoadingProducts(false);
    });
  }, []);

  // If editing, fetch adjustment batch and items
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    setError(null);
    Promise.all([
      adjustmentBatchesService.getById(id as string),
      productAdjustmentsService.getByBatchId(id as string),
    ]).then(([batchRes, itemsRes]) => {
      if (batchRes.error) setError(batchRes.error.message);
      else {
        const batch = batchRes.data;
        setReference(batch.reference_code || '');
        setDate(batch.adjusted_at ? new Date(batch.adjusted_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
        setSelectedWarehouse(batch.warehouse || '');
        setReason(batch.reason || '');
      }
      // Map adjustment items to adjustmentItems format
      setAdjustmentItems((itemsRes.data || []).map((item: any) => ({
        ...products.find((p: any) => p.id === item.product_id),
        id: item.product_id,
        type: item.type,
        quantity: item.quantity,
        before_stock: item.before_stock,
        after_stock: item.after_stock,
      })));
      setLoading(false);
    });
  }, [isEdit, id, products]);

  // Filter products by search
  const filteredProducts = productSearch
    ? products.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.code?.toLowerCase().includes(productSearch.toLowerCase())
      )
    : [];

  const handleSelectProduct = (product: any) => {
    const currentStock = currentStocks[product.id] || 0;
    const newItem = {
      ...product,
      type: 'addition',
      quantity: 0,
      before_stock: currentStock,
      after_stock: currentStock,
    };
    setAdjustmentItems([...adjustmentItems, newItem]);
    setProductSearch('');
    setShowProductDropdown(false);
    searchInputRef.current?.focus();
  };

  const handleRemoveItem = (index: number) => {
    setAdjustmentItems(adjustmentItems.filter((_, i) => i !== index));
  };

  const handleEditItem = (index: number) => {
    setEditItemIdx(index);
    setEditForm(adjustmentItems[index]);
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editItemIdx === null) return;
    const updatedItems = [...adjustmentItems];
    const item = updatedItems[editItemIdx];
    const newAfterStock = item.type === 'addition' 
      ? item.before_stock + Number(editForm.quantity)
      : item.before_stock - Number(editForm.quantity);
    
    updatedItems[editItemIdx] = {
      ...item,
      type: editForm.type,
      quantity: Number(editForm.quantity),
      after_stock: newAfterStock,
    };
    setAdjustmentItems(updatedItems);
    setEditModalOpen(false);
    setEditItemIdx(null);
    setEditForm({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustmentItems.length === 0) {
      setError('Please add at least one product to adjust');
      return;
    }

    if (!selectedWarehouse || selectedWarehouse.trim() === '') {
      setError('Please select a warehouse');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (isEdit) {
        // Update adjustment batch
        const batchData = {
          reference_code: reference,
          reason,
          warehouse: selectedWarehouse,
          adjusted_at: date,
        };
        await adjustmentBatchesService.update(id as string, batchData);
        
        // Remove old items and insert new
        const { data: oldItems } = await productAdjustmentsService.getByBatchId(id as string);
        if (oldItems && oldItems.length > 0) {
          for (const item of oldItems) {
            await productAdjustmentsService.remove(item.id);
          }
        }
        
        const items = adjustmentItems.map(item => ({
          adjustment_batch_id: id,
          product_id: item.id,
          type: item.type,
          quantity: item.quantity,
          before_stock: item.before_stock,
          after_stock: item.after_stock,
        }));
        await productAdjustmentsService.createMany(items);
        setSuccess('Stock adjustment updated successfully!');
      } else {
        // Create adjustment batch
        const batchData = {
          reference_code: reference,
          reason,
          warehouse: selectedWarehouse,
          adjusted_at: date,
        };
        const { data: batchRes, error: batchError } = await adjustmentBatchesService.create(batchData);
        if (batchError || !batchRes || !(batchRes as any[])[0]?.id) {
          console.error('Batch creation error:', batchError);
          console.error('Batch response:', batchRes);
          setError(batchError?.message || batchError?.details || 'Failed to create adjustment batch');
          setLoading(false);
          return;
        }
        
        const batchId = (batchRes as any[])[0].id;
        const items = adjustmentItems.map(item => ({
          adjustment_batch_id: batchId,
          product_id: item.id,
          type: item.type,
          quantity: item.quantity,
          before_stock: item.before_stock,
          after_stock: item.after_stock,
        }));
        await productAdjustmentsService.createMany(items);
        setSuccess('Stock adjustment created successfully!');
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <AdminLayout title="Stock Adjustment">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={isEdit ? "Edit Stock Adjustment" : "Create Stock Adjustment"}
      breadcrumb={<span>Products &gt; <span className="text-gray-900">Stock Adjustment</span></span>}
    >
      <div className="py-6 px-4">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reference Code</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Auto-generated"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Warehouse *</label>
            <select
              className="w-full border rounded px-3 py-2"
              required
              disabled={loadingWarehouses}
              value={selectedWarehouse}
              onChange={e => setSelectedWarehouse(e.target.value)}
            >
              <option value="">{loadingWarehouses ? 'Loading...' : 'Choose Warehouse'}</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Enter reason for stock adjustment..."
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-1">Product</label>
            <input
              ref={searchInputRef}
              className="w-full border rounded px-3 py-2"
              placeholder="Search Product by Code Or Name"
              disabled={loadingProducts}
              value={productSearch}
              onChange={e => {
                setProductSearch(e.target.value);
                setShowProductDropdown(true);
              }}
              onFocus={() => setShowProductDropdown(true)}
              autoComplete="off"
            />
            {showProductDropdown && productSearch && filteredProducts.length > 0 && (
              <ul className="absolute z-10 bg-white border w-full mt-1 rounded shadow max-h-60 overflow-y-auto">
                {filteredProducts.map((product: any) => (
                  <li
                    key={product.id}
                    className="px-4 py-2 hover:bg-purple-100 cursor-pointer"
                    onMouseDown={() => handleSelectProduct(product)}
                  >
                    {product.name} <span className="text-xs text-gray-400">({product.code})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Adjustment Items *</label>
            <div className="overflow-x-auto bg-gray-50 rounded-lg">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-center font-semibold">No.</th>
                    <th className="p-2 text-left font-semibold">Product</th>
                    <th className="p-2 text-left font-semibold">Current Stock</th>
                    <th className="p-2 text-left font-semibold">Type</th>
                    <th className="p-2 text-left font-semibold">Quantity</th>
                    <th className="p-2 text-left font-semibold">New Stock</th>
                    <th className="p-2 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustmentItems.length === 0 ? (
                    <tr>
                      <td className="p-2 text-center text-gray-400" colSpan={7}>No items added</td>
                    </tr>
                  ) : (
                    adjustmentItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-2 text-center">{idx + 1}</td>
                        <td className="p-2">
                          <div className="font-bold text-green-700 text-lg">{item.code}</div>
                          <span className="inline-block bg-green-100/80 text-green-700 text-xs px-2 py-0.5 rounded mt-1">{item.name}</span>
                        </td>
                        <td className="p-2">
                          <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                            {item.before_stock}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded ${
                            item.type === 'addition' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {item.type === 'addition' ? 'Addition' : 'Subtraction'}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="font-bold text-lg">{item.quantity}</span>
                        </td>
                        <td className="p-2">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded ${
                            item.after_stock >= item.before_stock 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {item.after_stock}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              type="button"
                              onClick={() => handleEditItem(idx)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
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
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Adjustment' : 'Create Adjustment')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/products/stock-adjustments')}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Edit Modal */}
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Adjustment Item"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product</label>
              <div className="p-2 bg-gray-100 rounded">
                {editForm.name} ({editForm.code})
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Current Stock</label>
              <div className="p-2 bg-gray-100 rounded">
                {editForm.before_stock}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={editForm.type || 'addition'}
                onChange={e => setEditForm({...editForm, type: e.target.value})}
              >
                <option value="addition">Addition</option>
                <option value="subtraction">Subtraction</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2"
                value={editForm.quantity || 0}
                onChange={e => {
                  const quantity = Number(e.target.value);
                  const newAfterStock = editForm.type === 'addition' 
                    ? editForm.before_stock + quantity
                    : editForm.before_stock - quantity;
                  setEditForm({
                    ...editForm, 
                    quantity,
                    after_stock: newAfterStock
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Stock</label>
              <div className="p-2 bg-gray-100 rounded">
                {editForm.after_stock}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
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

export default CreateStockAdjustment; 