import AdminLayout from '../../layouts/AdminLayout';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { suppliersService } from '../../services/suppliersService';
import { warehousesService } from '../../services/warehousesService';
import { productsService } from '../../services/productsService';
import { FaEdit, FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import Modal from '../../components/ui/Modal';
import { purchasesService } from '../../services/purchasesService';
import { getCurrentUser } from '../../utils/supabaseClient';
import { purchaseItemsService } from '../../services/purchaseItemsService';

const CreatePurchase = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productStocks, setProductStocks] = useState<any>({});
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Product search and order items state
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [orderTaxPercent, setOrderTaxPercent] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [note, setNote] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItemIdx, setEditItemIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add state for selected supplier and warehouse
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  // Add state for status
  const [status, setStatus] = useState('received');

  // Fetch all dropdown data
  useEffect(() => {
    suppliersService.getAll().then(({ data }) => {
      setSuppliers(data || []);
      setLoadingSuppliers(false);
    });
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
      setProductStocks(stockMap);
      setLoadingProducts(false);
    });
  }, []);

  // If editing, fetch purchase and purchase items
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    setError(null);
    Promise.all([
      purchasesService.getById(id as string),
      purchaseItemsService.getByPurchaseId(id as string),
    ]).then(([purchaseRes, itemsRes]) => {
      if (purchaseRes.error) setError(purchaseRes.error.message);
      else {
        const purchase = purchaseRes.data;
        setReference(purchase.reference || '');
        setDate(purchase.date || new Date().toISOString().slice(0, 10));
        setSelectedSupplier(purchase.supplier || '');
        setSelectedWarehouse(purchase.warehouse || '');
        setOrderTaxPercent(purchase.order_tax || 0);
        setOrderDiscount(purchase.discount || 0);
        setShipping(purchase.shipping || 0);
        setStatus(purchase.status || 'received');
        setNote(purchase.note || '');
      }
      // Map purchase items to orderItems format
      setOrderItems((itemsRes.data || []).map((item: any) => ({
        ...products.find((p: any) => p.id === item.product_id),
        id: item.product_id,
        qty: item.qty,
        discount: item.discount,
        tax: item.tax,
        product_cost: item.cost,
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

  // Add product to order items
  const handleSelectProduct = (product: any) => {
    if (orderItems.some(item => item.id === product.id)) return;
    setOrderItems((prev) => [
      ...prev,
      {
        ...product,
        qty: 1,
        discount: 0,
        tax: 0,
        subtotal: Number(product.product_cost) || 0,
      },
    ]);
    setProductSearch('');
    setShowProductDropdown(false);
    if (searchInputRef.current) searchInputRef.current.blur();
  };

  // Remove product from order items
  const handleRemoveOrderItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQtyChange = (idx: number, delta: number) => {
    setOrderItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ));
  };

  const handleQtyInput = (idx: number, value: number) => {
    setOrderItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, qty: Math.max(1, value) } : item
    ));
  };

  const handleDiscountChange = (idx: number, delta: number) => {
    setOrderItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, discount: Math.max(0, Number(item.discount) + delta) } : item
    ));
  };

  const handleDiscountInput = (idx: number, value: number) => {
    setOrderItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, discount: Math.max(0, value) } : item
    ));
  };

  // Compute totals
  const itemsSubtotal = useMemo(() => orderItems.reduce((sum, item) => sum + (item.product_cost * item.qty), 0), [orderItems]);
  const itemsDiscount = useMemo(() => orderItems.reduce((sum, item) => sum + Number(item.discount), 0), [orderItems]);
  const itemsTax = useMemo(() => orderItems.reduce((sum, item) => sum + Number(item.tax), 0), [orderItems]);
  const computedOrderTax = useMemo(() => (orderTaxPercent > 0 ? (itemsSubtotal - itemsDiscount) * (orderTaxPercent / 100) : 0), [itemsSubtotal, itemsDiscount, orderTaxPercent]);
  const computedShipping = Number(shipping) || 0;
  const grandTotal = useMemo(() => (itemsSubtotal - itemsDiscount + itemsTax + computedOrderTax + computedShipping), [itemsSubtotal, itemsDiscount, itemsTax, computedOrderTax, computedShipping]);

  const handleEditOpen = (idx: number) => {
    setEditItemIdx(idx);
    const item = orderItems[idx];
    setEditForm({
      product_cost: item.product_cost,
      order_tax: item.order_tax || 0,
      tax_type: item.tax_type || 'Exclusive',
      discount_type: item.discount_type || 'Fixed',
      discount: item.discount,
      purchase_unit: item.purchase_unit || '',
    });
    setEditModalOpen(true);
  };

  const handleEditChange = (e: any) => {
    const { name, value } = e.target;
    setEditForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = (e: any) => {
    e.preventDefault();
    if (editItemIdx === null) return;
    setOrderItems((prev) => prev.map((item, i) =>
      i === editItemIdx ? {
        ...item,
        product_cost: Number(editForm.product_cost),
        order_tax: Number(editForm.order_tax),
        tax_type: editForm.tax_type,
        discount_type: editForm.discount_type,
        discount: Number(editForm.discount),
        purchase_unit: editForm.purchase_unit,
      } : item
    ));
    setEditModalOpen(false);
    setEditItemIdx(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (isEdit) {
        // Delete old items FIRST to ensure stock is decremented from the OLD warehouse
        const { data: oldItems } = await purchaseItemsService.getByPurchaseId(id as string);
        if (oldItems && oldItems.length > 0) {
          for (const item of oldItems) {
            await purchaseItemsService.remove(item.id);
          }
        }
        // Then update purchase header (possibly changing warehouse)
        const purchaseData = {
          reference,
          date,
          supplier: selectedSupplier,
          warehouse: selectedWarehouse,
          order_tax: orderTaxPercent,
          discount: orderDiscount,
          shipping,
          status,
          note,
          total_amount: grandTotal,
        };
        await purchasesService.update(id as string, purchaseData);
        // Finally insert new items so stock is added to the (possibly new) warehouse
        const items = orderItems.map(item => ({
          purchase_id: id,
          product_id: item.id,
          cost: item.product_cost,
          qty: item.qty,
          discount: item.discount,
          tax: item.tax,
        }));
        await purchaseItemsService.create(items);
        setSuccess('Purchase updated successfully!');
      } else {
        // Create purchase
        const purchaseData = {
          reference,
          date,
          supplier: selectedSupplier,
          warehouse: selectedWarehouse,
          order_tax: orderTaxPercent,
          discount: orderDiscount,
          shipping,
          status,
          note,
          total_amount: grandTotal,
        };
        // Get current user for audit logging
        const user = await getCurrentUser();
        console.log('Current user for purchase creation:', user?.id, user?.email); // Debug log
        
        const { data: purchaseRes, error: purchaseError } = await purchasesService.create(purchaseData, user?.id) as unknown as { data: { id: string }[]; error: any };
        if (purchaseError || !purchaseRes || !purchaseRes[0]?.id) {
          console.error('purchaseError', purchaseError);
          setError(purchaseError?.message || 'Failed to create purchase');
          setLoading(false);
          return;
        }
        const purchaseId = purchaseRes[0].id;
        const items = orderItems.map(item => ({
          purchase_id: purchaseId,
          product_id: item.id,
          cost: item.product_cost,
          qty: item.qty,
          discount: item.discount,
          tax: item.tax,
        }));
        await purchaseItemsService.create(items);
        setSuccess('Purchase created successfully!');
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <AdminLayout
      title={isEdit ? "Edit Purchase" : "Create Purchase"}
      breadcrumb={
        <span>All Purchases &gt; <span className="text-gray-900">{isEdit ? "Edit Purchase" : "Create Purchase"}</span></span>
      }
    >
      <div className="py-6 px-4">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Reference *</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Enter Reference"
              value={reference}
              onChange={e => setReference(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supplier *</label>
              <select
                className="w-full border rounded px-3 py-2"
                required
                disabled={loadingSuppliers}
                value={selectedSupplier}
                onChange={e => setSelectedSupplier(e.target.value)}
              >
                <option value="">{loadingSuppliers ? 'Loading...' : 'Choose Supplier'}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
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
          </div>
          <div className="relative">
            <label className="block text-sm font-medium mb-1">Product</label>
            <input
              ref={searchInputRef}
              className="w-full border rounded px-3 py-2"
              placeholder="Scan/Search Product by Code Or Name"
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
            <label className="block text-sm font-medium mb-1">Order items *</label>
            <div className="overflow-x-auto bg-gray-50 rounded-lg">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-center font-semibold">No.</th>
                    <th className="p-2 text-left font-semibold">Product</th>
                    <th className="p-2 text-left font-semibold">Net Unit Cost</th>
                    <th className="p-2 text-left font-semibold">Stock</th>
                    <th className="p-2 text-left font-semibold">Qty</th>
                    <th className="p-2 text-left font-semibold">Discount</th>
                    <th className="p-2 text-left font-semibold">Tax</th>
                    <th className="p-2 text-left font-semibold">Subtotal</th>
                    <th className="p-2 text-center font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.length === 0 ? (
                    <tr>
                      <td className="p-2 text-center text-gray-400" colSpan={9}>No data Available</td>
                    </tr>
                  ) : (
                    orderItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-2 text-center">{idx + 1}</td>
                        <td className="p-2">
                          <div className="font-bold text-green-700 text-lg">{item.code}</div>
                          <span className="inline-block bg-green-100/80 text-green-700 text-xs px-2 py-0.5 rounded mt-1">{item.name}</span>
                        </td>
                        <td className="p-2">
                          <span className="font-bold text-green-700 text-lg">₱ {Number(item.product_cost).toFixed(2)}</span>
                        </td>
                        <td className="p-2">
                          <span className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded">
                            {productStocks[item.id] ?? 0}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <button type="button" className="bg-purple-100 text-purple-700 rounded px-2 py-1" onClick={() => handleQtyChange(idx, -1)}><FaMinus /></button>
                            <input
                              type="number"
                              min={1}
                              value={item.qty}
                              onChange={e => handleQtyInput(idx, Number(e.target.value))}
                              className="w-12 text-center border rounded mx-1"
                            />
                            <button type="button" className="bg-purple-100 text-purple-700 rounded px-2 py-1" onClick={() => handleQtyChange(idx, 1)}><FaPlus /></button>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center">
                            <span className="mr-1 text-gray-400">₱</span>
                            <input
                              type="number"
                              min={0}
                              value={item.discount}
                              readOnly
                              className="w-16 text-center border rounded bg-gray-50 cursor-not-allowed"
                            />
                          </div>
                        </td>
                        <td className="p-2">₱ {Number(item.tax).toFixed(2)}</td>
                        <td className="p-2 font-bold">₱ {Number(item.product_cost * item.qty - item.discount + item.tax).toFixed(2)}</td>
                        <td className="p-2 align-middle">
                          <div className="flex items-center justify-center gap-2 h-full">
                            <button type="button" className="text-green-600 hover:text-green-800" onClick={() => handleEditOpen(idx)}><FaEdit /></button>
                            <button type="button" className="text-red-500 hover:text-red-700" onClick={() => handleRemoveOrderItem(idx)}><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Order Tax</label>
              <div className="flex items-center gap-2">
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="0"
                  type="number"
                  value={orderTaxPercent}
                  onChange={e => setOrderTaxPercent(Number(e.target.value))}
                />
                <span className="text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount</label>
              <div className="flex items-center gap-2">
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="0"
                  type="number"
                  value={orderDiscount}
                  onChange={e => setOrderDiscount(Number(e.target.value))}
                />
                <span className="text-gray-400">₱</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Shipping</label>
              <div className="flex items-center gap-2">
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="0"
                  type="number"
                  value={shipping}
                  onChange={e => setShipping(Number(e.target.value))}
                />
                <span className="text-gray-400">₱</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status *</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={status}
                onChange={e => setStatus(e.target.value)}
                required
              >
                <option value="received">Received</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Note</label>
              <textarea className="w-full border rounded px-3 py-2" placeholder="A few words ..." rows={1} value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:justify-end gap-4 mt-4">
            <div className="bg-gray-50 rounded p-4 w-full md:w-80">
              <div className="flex justify-between mb-2"><span>Order Tax</span><span>₱ {computedOrderTax.toFixed(2)} ({orderTaxPercent.toFixed(2)}%)</span></div>
              <div className="flex justify-between mb-2"><span>Discount</span><span>₱ {itemsDiscount.toFixed(2)}</span></div>
              <div className="flex justify-between mb-2"><span>Shipping</span><span>₱ {computedShipping.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Grand Total</span><span>₱ {grandTotal.toFixed(2)}</span></div>
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Submit'}
          </button>
          {error && <div className="text-red-500 mt-2">{error}</div>}
          {success && <div className="text-green-600 mt-2">{success}</div>}
        </form>
      </div>
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={orderItems[editItemIdx || 0]?.name}>
        <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Cost *</label>
            <input name="product_cost" type="number" className="w-full border rounded px-3 py-2" value={editForm.product_cost} onChange={handleEditChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tax Type *</label>
            <select name="tax_type" className="w-full border rounded px-3 py-2" value={editForm.tax_type} onChange={handleEditChange} required>
              <option value="Exclusive">Exclusive</option>
              <option value="Inclusive">Inclusive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order Tax *</label>
            <div className="flex items-center gap-2">
              <input name="order_tax" type="number" className="w-full border rounded px-3 py-2" value={editForm.order_tax} onChange={handleEditChange} required />
              <span className="text-gray-400">%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Discount Type *</label>
            <select name="discount_type" className="w-full border rounded px-3 py-2" value={editForm.discount_type} onChange={handleEditChange} required>
              <option value="Fixed">Fixed</option>
              <option value="Percent">Percent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Discount *</label>
            <div className="flex items-center">
              <span className="mr-1 text-gray-400">₱</span>
              <input name="discount" type="number" className="w-full border rounded px-3 py-2" value={editForm.discount} onChange={handleEditChange} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Purchase Unit *</label>
            <select name="purchase_unit" className="w-full border rounded px-3 py-2" value={editForm.purchase_unit} onChange={handleEditChange} required>
              <option value="">Select Unit</option>
              {/* You can map available units here if needed */}
              <option value="Piece">Piece</option>
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end mt-4">
            <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Submit</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default CreatePurchase; 