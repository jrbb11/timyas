import AdminLayout from '../../layouts/AdminLayout';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customersService } from '../../services/customersService';
import { warehousesService } from '../../services/warehousesService';
import { productsService } from '../../services/productsService';
import { FaEdit, FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import Modal from '../../components/ui/Modal';
import { salesService } from '../../services/salesService';
import { saleItemsService } from '../../services/saleItemsService';
import { getCurrentUser } from '../../utils/supabaseClient';
import { supabase } from '../../utils/supabaseClient';
import Select from 'react-select';

const CreateSale = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productStocks, setProductStocks] = useState<any>({});
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Product search and order items state
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [orderTax, setOrderTax] = useState(0);
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

  // Add state for selected warehouse
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  // Add state for status and payment status
  const [status, setStatus] = useState('order_placed');
  const [paymentStatus, setPaymentStatus] = useState('pending');

  // Add state for audit logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  // Add state for branches
  const [peopleBranches, setPeopleBranches] = useState<any[]>([]);
  const [selectedPeopleBranch, setSelectedPeopleBranch] = useState('');

  // Fetch all dropdown data
  useEffect(() => {
    warehousesService.getAll().then(({ data }) => {
      setWarehouses(data || []);
      setLoadingWarehouses(false);
    });
    supabase.from('people_branches_view').select('*').then(({ data }) => {
      setPeopleBranches(data || []);
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

  // If editing, fetch sale and sale items
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    setError(null);
    Promise.all([
      salesService.getById(id as string),
      saleItemsService.getBySaleId(id as string),
    ]).then(([saleRes, itemsRes]) => {
      if (saleRes.error) setError(saleRes.error.message);
      else {
        const sale = saleRes.data;
        setInvoiceNumber(sale.invoice_number || '');
        setDate(sale.date || new Date().toISOString().slice(0, 10));
        setSelectedWarehouse(sale.warehouse || '');
        setOrderTaxPercent(sale.order_tax || 0);
        setOrderDiscount(sale.discount || 0);
        setShipping(sale.shipping || 0);
        setStatus(sale.status || 'order_placed');
        setPaymentStatus(sale.payment_status || 'pending');
        setNote(sale.note || '');
        setSelectedPeopleBranch(sale.people_branches_id || '');
      }
      // Map sale items to orderItems format
      setOrderItems((itemsRes.data || []).map((item: any) => ({
        ...products.find((p: any) => p.id === item.product_id),
        id: item.product_id,
        qty: item.qty,
        discount: item.discount,
        tax: item.tax,
        product_price: item.price,
      })));
      setLoading(false);
    });
  }, [isEdit, id, products]);

  // Fetch audit logs
  useEffect(() => {
    if (!isEdit || !id) return;
    setLoadingAudit(true);
    salesService.getAuditLogs(id as string).then(async ({ data, error }) => {
      if (error) setAuditError(error.message);
      else {
        setAuditLogs(data || []);
        // Fetch user names for all user_ids in logs
        const userIds = Array.from(new Set((data || []).map((log: any) => log.user_id)));
        if (userIds.length) {
          const users = await customersService.getUsersByIds(userIds);
          const map: Record<string, string> = {};
          users.forEach((u: any) => { map[u.user_id] = u.name || u.email || u.user_id; });
          setUserMap(map);
        }
      }
      setLoadingAudit(false);
    });
  }, [isEdit, id]);

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
    // Prevent duplicate
    if (orderItems.some(item => item.id === product.id)) return;
    setOrderItems((prev) => [
      ...prev,
      {
        ...product,
        qty: 1,
        discount: 0,
        tax: 0,
        subtotal: Number(product.product_price) || 0,
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
  const itemsSubtotal = useMemo(() => orderItems.reduce((sum, item) => sum + (item.product_price * item.qty), 0), [orderItems]);
  const itemsDiscount = useMemo(() => orderItems.reduce((sum, item) => sum + Number(item.discount), 0), [orderItems]);
  const itemsTax = useMemo(() => orderItems.reduce((sum, item) => sum + Number(item.tax), 0), [orderItems]);
  const computedOrderTax = useMemo(() => (orderTaxPercent > 0 ? (itemsSubtotal - itemsDiscount) * (orderTaxPercent / 100) : 0), [itemsSubtotal, itemsDiscount, orderTaxPercent]);
  const computedShipping = Number(shipping) || 0;
  const grandTotal = useMemo(() => (itemsSubtotal - itemsDiscount + itemsTax + computedOrderTax + computedShipping), [itemsSubtotal, itemsDiscount, itemsTax, computedOrderTax, computedShipping]);

  const handleEditOpen = (idx: number) => {
    setEditItemIdx(idx);
    const item = orderItems[idx];
    setEditForm({
      product_price: item.product_price,
      order_tax: item.order_tax || 0,
      tax_type: item.tax_type || 'Exclusive',
      discount_type: item.discount_type || 'Fixed',
      discount: item.discount,
      sale_unit: item.sale_unit || '',
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
        product_price: Number(editForm.product_price),
        order_tax: Number(editForm.order_tax),
        tax_type: editForm.tax_type,
        discount_type: editForm.discount_type,
        discount: Number(editForm.discount),
        sale_unit: editForm.sale_unit,
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
        // Fetch current user
        const user = await getCurrentUser();
        if (!user) {
          setError('User not authenticated.');
          setLoading(false);
          return;
        }
        // Fetch old sale data for diff
        const { data: oldSale, error: oldError } = await salesService.getById(id as string);
        if (oldError) {
          setError('Failed to fetch original sale for audit.');
          setLoading(false);
          return;
        }
        // Prepare update data
        const saleData = {
          invoice_number: invoiceNumber,
          date,
          people_branches_id: selectedPeopleBranch,
          warehouse: selectedWarehouse,
          order_tax: orderTaxPercent,
          discount: orderDiscount,
          shipping,
          status,
          payment_status: paymentStatus,
          note,
          total_amount: grandTotal,
        };
        const { error: updateError } = await salesService.update(id as string, saleData, user.id, oldSale);
        if (updateError) {
          setError(updateError.message || 'Failed to update sale');
          setLoading(false);
          return;
        }
        setSuccess('Sale updated successfully!');
        setLoading(false);
        return;
      }
      // Check for duplicate invoice_number
      const { data: existing, error: checkError } = await salesService.getByInvoiceNumber(invoiceNumber);
      if ((existing && existing.length > 0)) {
        setError('Invoice number already exists. Please use a unique invoice number.');
        setLoading(false);
        return;
      }
      // 1. Insert sale
      const saleData = {
        invoice_number: invoiceNumber,
        date: new Date().toISOString().slice(0, 10),
        people_branches_id: selectedPeopleBranch,
        warehouse: selectedWarehouse,
        order_tax: orderTaxPercent,
        discount: orderDiscount,
        shipping,
        status,
        payment_status: paymentStatus,
        note,
        total_amount: grandTotal,
      };
      console.log('saleData', saleData);
      const { data: saleRes, error: saleError } = await salesService.create(saleData) as unknown as { data: { id: string }[]; error: any };
      if (saleError || !saleRes || !saleRes[0]?.id) {
        console.error('saleError', saleError);
        setError(saleError?.message || 'Failed to create sale');
        setLoading(false);
        return;
      }
      const saleId = saleRes[0].id;
      // 2. Insert sale items
      const items = orderItems.map(item => ({
        sale_id: saleId,
        product_id: item.id,
        price: item.product_price,
        qty: item.qty,
        discount: item.discount,
        tax: item.tax,
      }));
      const { error: itemsError } = await saleItemsService.create(items);
      if (itemsError) {
        setError(itemsError.message);
        setLoading(false);
        return;
      }
      setSuccess('Sale created successfully!');
      // Optionally redirect or reset form
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const lockedStatuses = ['delivered', 'cancel'];
  const isEditable = isEdit ? (['order_placed', 'for_delivery'].includes(status) && paymentStatus !== 'paid' && !lockedStatuses.includes(status)) : true;

  return (
    <AdminLayout
      title={isEdit ? "Edit Sale" : "Create Sale"}
      breadcrumb={
        <span>All Sales &gt; <span className="text-gray-900">{isEdit ? "Edit Sale" : "Create Sale"}</span></span>
      }
    >
      <div className="py-6 px-4">
        {/* Warning or lock message */}
        {isEdit && isEditable && (
          <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
            <b>Warning:</b> Editing sales is allowed only for pending/draft sales. All changes are logged for audit purposes.
          </div>
        )}
        {isEdit && !isEditable && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-800 rounded">
            <b>Locked:</b> This sale cannot be edited because it is delivered, paid, or cancelled. For major changes, use a return or credit note.
          </div>
        )}
        {/* Audit log placeholder */}
        {isEdit && (
          <div className="mb-4">
            <h3 className="font-semibold mb-1">Change History</h3>
            {loadingAudit ? (
              <div className="text-gray-500">Loading history...</div>
            ) : auditError ? (
              <div className="text-red-500">{auditError}</div>
            ) : auditLogs.length === 0 ? (
              <div className="text-gray-400">No changes yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">When</th>
                      <th className="p-2 text-left">Who</th>
                      <th className="p-2 text-left">Changes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="border-t">
                        <td className="p-2 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-2 whitespace-nowrap">{userMap[log.user_id] || log.user_id}</td>
                        <td className="p-2">
                          <ul className="list-disc ml-4">
                            {Object.entries(JSON.parse(log.changes)).map(([field, change]: any) => (
                              <li key={field}><b>{field}</b>: {String(change.from)} → {String(change.to)}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Invoice Number *</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Enter Invoice Number"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              required
              disabled={!isEditable}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input type="date" className="w-full border rounded px-3 py-2" defaultValue={new Date().toISOString().slice(0,10)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Customer & Branch *</label>
              <Select
                classNamePrefix="react-select"
                options={peopleBranches.map(pb => ({
                  value: pb.id,
                  label: pb.person_name,
                  branch: pb.branch_name
                }))}
                value={peopleBranches
                  .map(pb => ({ value: pb.id, label: pb.person_name, branch: pb.branch_name }))
                  .find(opt => opt.value === selectedPeopleBranch) || null}
                onChange={opt => setSelectedPeopleBranch(opt ? opt.value : '')}
                placeholder="Choose Customer & Branch"
                isClearable
                required
                formatOptionLabel={(option, { context }) => (
                  context === 'menu' ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700 }}>{option.label}</span>
                      <span style={{ color: '#2563eb', fontSize: 13 }}>{option.branch}</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700 }}>{option.label}</span>
                      <span style={{ color: '#2563eb', fontSize: 13 }}>
                        ({option.branch})
                      </span>
                    </div>
                  )
                )}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    borderColor: state.isFocused ? '#111827' : '#111827',
                    boxShadow: state.isFocused ? '0 0 0 2px #374151' : 'none',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    paddingLeft: '0.75rem',
                    paddingRight: '0.75rem',
                    backgroundColor: 'white',
                    '&:hover': { borderColor: '#111827' },
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: '0',
                  }),
                  input: (base) => ({
                    ...base,
                    margin: '0',
                    padding: '0',
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? '#f3f4f6' : state.isFocused ? '#e0e7ff' : 'white',
                    color: '#111827',
                    padding: 12,
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                  }),
                  singleValue: (base) => ({ ...base, display: 'flex', alignItems: 'center', gap: 8, fontSize: '16px', fontFamily: 'inherit' }),
                  menu: (base) => ({ ...base, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }),
                  placeholder: (base) => ({ ...base, color: '#9ca3af', fontSize: '16px', fontFamily: 'inherit' }),
                  indicatorSeparator: () => ({ display: 'none' }),
                  dropdownIndicator: (base, state) => ({
                    ...base,
                    color: state.isFocused ? '#a78bfa' : '#9ca3af',
                    '&:hover': { color: '#a78bfa' },
                  }),
                }}
              />
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
                    <th className="p-2 text-left font-semibold">Net Unit Price</th>
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
                          <span className="font-bold text-green-700 text-lg">₱ {Number(item.product_price).toFixed(2)}</span>
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
                        <td className="p-2 font-bold">₱ {Number(item.product_price * item.qty - item.discount + item.tax).toFixed(2)}</td>
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
                <option value="order_placed">Order Placed</option>
                <option value="for_delivery">For Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancel">Cancel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Status</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value)}
                required
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
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
          <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" disabled={loading || !isEditable}>
            {loading ? 'Saving...' : 'Submit'}
          </button>
          {error && <div className="text-red-500 mt-2">{error}</div>}
          {success && <div className="text-green-600 mt-2">{success}</div>}
        </form>
      </div>
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={orderItems[editItemIdx || 0]?.name}>
        <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Price *</label>
            <input name="product_price" type="number" className="w-full border rounded px-3 py-2" value={editForm.product_price} onChange={handleEditChange} required />
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
            <label className="block text-sm font-medium mb-1">Sale Unit *</label>
            <select name="sale_unit" className="w-full border rounded px-3 py-2" value={editForm.sale_unit} onChange={handleEditChange} required>
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

export default CreateSale; 