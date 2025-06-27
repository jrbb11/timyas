import AdminLayout from '../layouts/AdminLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { purchasesService } from '../services/purchasesService';
import { suppliersService } from '../services/suppliersService';
import { warehousesService } from '../services/warehousesService';
import { purchaseItemsService } from '../services/purchaseItemsService';
import { productsService } from '../services/productsService';

const PurchaseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<any>(null);
  const [supplier, setSupplier] = useState<any>(null);
  const [warehouse, setWarehouse] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      purchasesService.getById(id as string),
      purchaseItemsService.getByPurchaseId(id as string),
      productsService.getAll(),
    ]).then(async ([purchaseRes, itemsRes, productsRes]) => {
      if (purchaseRes.error) setError(purchaseRes.error.message);
      else {
        setPurchase(purchaseRes.data);
        setItems(itemsRes.data || []);
        setProducts(productsRes.data || []);
        // Fetch supplier and warehouse info
        const [{ data: supplierData }, { data: warehouseData }] = await Promise.all([
          suppliersService.getById(purchaseRes.data.supplier),
          warehousesService.getById(purchaseRes.data.warehouse),
        ]);
        setSupplier(supplierData);
        setWarehouse(warehouseData);
      }
      setLoading(false);
    });
  }, [id]);

  // Totals
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.cost * item.qty), 0);
  const itemsDiscount = items.reduce((sum, item) => sum + Number(item.discount), 0);
  const itemsTax = items.reduce((sum, item) => sum + Number(item.tax), 0);
  const computedOrderTax = purchase ? (purchase.order_tax > 0 ? (itemsSubtotal - itemsDiscount) * (purchase.order_tax / 100) : 0) : 0;
  const computedShipping = purchase ? Number(purchase.shipping) || 0 : 0;
  const grandTotal = itemsSubtotal - itemsDiscount + itemsTax + computedOrderTax + computedShipping;
  const paid = purchase?.paid || 0;
  const due = grandTotal - paid;

  return (
    <AdminLayout
      title="Purchase Detail"
      breadcrumb={<span>All Purchases &gt; <span className="text-gray-900">Purchase Detail</span></span>}
    >
      <div className="py-6 px-4">
        <div className="flex flex-wrap gap-2 mb-6">
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600" onClick={() => navigate(`/purchases/edit/${id}`)}>Edit Purchase</button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Email</button>
          <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">SMS</button>
          <button className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600">PDF</button>
          <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Print</button>
          <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Delete</button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : !purchase ? (
          <div className="p-8 text-center text-gray-500">Purchase not found.</div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row md:justify-between mb-8">
              <div>
                <div className="text-lg font-bold mb-2">Supplier Info</div>
                <div>{supplier?.name}</div>
                {supplier?.company && <div>{supplier.company}</div>}
                {supplier?.email && <div>{supplier.email}</div>}
                {supplier?.phone && <div>{supplier.phone}</div>}
                {supplier?.address && <div>{supplier.address}</div>}
                {supplier?.city && <div>{supplier.city}</div>}
                {supplier?.country && <div>{supplier.country}</div>}
              </div>
              <div className="text-center md:text-right mt-6 md:mt-0">
                <div className="text-lg font-bold mb-2">Purchase Info</div>
                <div>Reference: <span className="font-semibold">{purchase.reference}</span></div>
                <div>Status: <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs ml-1">{purchase.status}</span></div>
                <div>Warehouse: <span className="font-semibold">{warehouse?.name}</span></div>
                <div>Payment Status: <span className="inline-block bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs ml-1">{purchase.payment_status || 'Unpaid'}</span></div>
              </div>
            </div>
            <div className="mb-8">
              <div className="text-lg font-bold mb-2">Order Summary</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left font-semibold">Product</th>
                      <th className="p-2 text-left font-semibold">Net Unit Cost</th>
                      <th className="p-2 text-left font-semibold">Quantity</th>
                      <th className="p-2 text-left font-semibold">Unit Cost</th>
                      <th className="p-2 text-left font-semibold">Discount</th>
                      <th className="p-2 text-left font-semibold">Tax</th>
                      <th className="p-2 text-left font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{products.find((p: any) => p.id === item.product_id)?.name || item.product_id}</td>
                        <td className="p-2">₱ {Number(item.cost).toFixed(2)}</td>
                        <td className="p-2">{item.qty}</td>
                        <td className="p-2">₱ {Number(item.cost).toFixed(2)}</td>
                        <td className="p-2">₱ {Number(item.discount).toFixed(2)}</td>
                        <td className="p-2">₱ {Number(item.tax).toFixed(2)}</td>
                        <td className="p-2 font-bold">₱ {Number(item.cost * item.qty - item.discount + item.tax).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:justify-end gap-4 mt-4">
              <div className="bg-gray-50 rounded p-4 w-full md:w-80">
                <div className="flex justify-between mb-2"><span>Order Tax</span><span>₱ {computedOrderTax.toFixed(2)} ({purchase.order_tax?.toFixed(2) || '0.00'}%)</span></div>
                <div className="flex justify-between mb-2"><span>Discount</span><span>₱ {itemsDiscount.toFixed(2)}</span></div>
                <div className="flex justify-between mb-2"><span>Shipping</span><span>₱ {computedShipping.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg"><span>Grand Total</span><span>₱ {grandTotal.toFixed(2)}</span></div>
                <div className="flex justify-between mb-2"><span>Paid</span><span>₱ {paid.toFixed(2)}</span></div>
                <div className="flex justify-between mb-2"><span>Due</span><span>₱ {due.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PurchaseView; 