import AdminLayout from '../../layouts/AdminLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { salesService } from '../../services/salesService';
import { saleItemsService } from '../../services/saleItemsService';
import { salePaymentsService } from '../../services/salePaymentsService';

const mockMethods = [
  { id: 1, name: 'Cash' },
  { id: 2, name: 'Bank Transfer' },
  { id: 3, name: 'Credit Card' },
];
const mockAccounts = [
  { id: 1, name: 'Cash' },
  { id: 2, name: 'Bank' },
  { id: 3, name: 'Credit Card' },
];

const SaleView = () => {
  const { id } = useParams();
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      salesService.getViewById(id as string),
      saleItemsService.getBySaleId(id as string),
    ]).then(([saleRes, itemsRes]) => {
      if (saleRes.error) setError(saleRes.error.message);
      else setSale(saleRes.data?.[0] || null);
      setItems(itemsRes.data || []);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoadingPayments(true);
    salePaymentsService.getBySaleId(id as string).then(({ data }) => {
      setPayments(data || []);
      setLoadingPayments(false);
    });
  }, [id]);

  const handleDeletePayment = async (paymentId: string) => {
    setDeletingPaymentId(paymentId);
    await salePaymentsService.delete(paymentId);
    setPayments(payments.filter(p => p.id !== paymentId));
    setDeletingPaymentId(null);
  };

  return (
    <AdminLayout
      title="Sale Details"
      breadcrumb={<span>Sales &gt; <span className="text-gray-900">View Sale</span></span>}
    >
      <div className="py-6 px-4">
        <button className="mb-4 text-blue-600 hover:underline" onClick={() => navigate(-1)}>&larr; Back</button>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : !sale ? (
          <div className="p-8 text-center text-gray-500">Sale not found.</div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div><span className="font-medium text-gray-500">Reference:</span> <span className="font-semibold text-gray-900">{sale.reference}</span></div>
              <div><span className="font-medium text-gray-500">Invoice:</span> <span className="font-semibold text-gray-900">{sale.invoice_number}</span></div>
              <div><span className="font-medium text-gray-500">Customer:</span> <span className="font-semibold text-gray-900">{sale.customer_name}</span></div>
              <div><span className="font-medium text-gray-500">Warehouse:</span> <span className="font-semibold text-gray-900">{sale.warehouse_name}</span></div>
              <div><span className="font-medium text-gray-500">Status:</span> <span className="font-semibold text-gray-900">{sale.status}</span></div>
              <div><span className="font-medium text-gray-500">Payment Status:</span> <span className="font-semibold text-gray-900">{sale.payment_status}</span></div>
              <div><span className="font-medium text-gray-500">Total:</span> <span className="font-semibold text-gray-900">{Number(sale.total_amount).toLocaleString()}</span></div>
              <div><span className="font-medium text-gray-500">Paid:</span> <span className="font-semibold text-gray-900">{Number(sale.paid || 0).toLocaleString()}</span></div>
              <div><span className="font-medium text-gray-500">Due:</span> <span className="font-semibold text-gray-900">{Number(sale.due || 0).toLocaleString()}</span></div>
            </div>
            {/* Sale items table if available */}
            {items && items.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-2">Sale Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left font-semibold">Product</th>
                        <th className="p-3 text-left font-semibold">Quantity</th>
                        <th className="p-3 text-left font-semibold">Unit Price</th>
                        <th className="p-3 text-left font-semibold">Discount</th>
                        <th className="p-3 text-left font-semibold">Tax</th>
                        <th className="p-3 text-left font-semibold">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          <td className="p-3">{item.product_name}</td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">{Number(item.unit_price).toFixed(2)}</td>
                          <td className="p-3">{Number(item.discount).toFixed(2)}</td>
                          <td className="p-3">{Number(item.tax).toFixed(2)}</td>
                          <td className="p-3">{Number(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {payments && payments.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-2">Payment History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left font-semibold">Date</th>
                        <th className="p-3 text-left font-semibold">Amount</th>
                        <th className="p-3 text-left font-semibold">Method</th>
                        <th className="p-3 text-left font-semibold">Account</th>
                        <th className="p-3 text-left font-semibold">Reference</th>
                        <th className="p-3 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p: any) => (
                        <tr key={p.id} className="border-b">
                          <td className="p-3">{p.payment_date}</td>
                          <td className="p-3">{Number(p.amount).toLocaleString()}</td>
                          <td className="p-3">{mockMethods.find(m => m.id === p.payment_method_id)?.name || p.payment_method_id}</td>
                          <td className="p-3">{mockAccounts.find(a => a.id === p.account_id)?.name || p.account_id}</td>
                          <td className="p-3">{p.reference_number}</td>
                          <td className="p-3">
                            <button className="text-red-600 hover:underline" onClick={() => handleDeletePayment(p.id)} disabled={deletingPaymentId === p.id}>{deletingPaymentId === p.id ? 'Deleting...' : 'Delete'}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SaleView; 