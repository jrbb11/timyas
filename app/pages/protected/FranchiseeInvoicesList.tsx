import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { franchiseeInvoicesService } from '../../services/franchiseeInvoicesService';
import { customersService } from '../../services/customersService';
import { supabase } from '../../utils/supabaseClient';
import { OpeningBalanceModal } from '../../components/franchisee/OpeningBalanceModal';

type FranchiseeOption = {
  id: string;
  name: string;
  people_branches_id: string;
  branch_id: string;
  branch_name: string;
};

const FranchiseeInvoicesList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedFranchisee, setSelectedFranchisee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [franchisees, setFranchisees] = useState<FranchiseeOption[]>([]);

  // Opening Balance Modal
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [selectedFranchiseeForBalance, setSelectedFranchiseeForBalance] = useState<{
    id: string;
    name: string;
    people_branches_id: string;
    branch_id: string;
    branch_name?: string;
  } | null>(null);

  useEffect(() => {
    loadFranchisees();
    loadInvoices();
  }, [selectedFranchisee, selectedStatus, selectedPaymentStatus, fromDate, toDate]);

  const loadFranchisees = async () => {
    const { data } = await supabase
      .from('people_branches_view')
      .select('*');

    if (data) {
      const options = data.map((pb: any) => ({
        id: pb.person_id,
        name: pb.person_name,
        people_branches_id: pb.id,
        branch_id: pb.branch_id,
        branch_name: pb.branch_name
      }));
      setFranchisees(options);
    }
  };



  const loadInvoices = async () => {
    setLoading(true);
    setError(null);

    const filters: any = {};
    if (selectedFranchisee) filters.franchisee_id = selectedFranchisee;
    if (selectedStatus) filters.status = selectedStatus;
    if (selectedPaymentStatus) filters.payment_status = selectedPaymentStatus;
    if (fromDate) filters.from_date = fromDate;
    if (toDate) filters.to_date = toDate;

    const { data, error: err } = await franchiseeInvoicesService.getAll(filters);

    if (err) {
      setError(err.message);
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      unpaid: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout
      title="Franchisee Invoices"
      breadcrumb={<span>Invoicing &gt; <span className="text-gray-900">Franchisee Invoices</span></span>}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Franchisee Invoices</h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedFranchiseeForBalance(null);
                setShowOpeningBalanceModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              + Opening Balance
            </button>
            <button
              onClick={() => navigate('/franchisee-invoices/generate')}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              + Generate Invoice
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Franchisee
              </label>
              <select
                value={selectedFranchisee}
                onChange={(e) => setSelectedFranchisee(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="">All Franchisees</option>
                {franchisees.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="">All Payment Statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No invoices found. Generate your first invoice to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Franchisee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 cursor-pointer">
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600"
                        onClick={() => navigate(`/franchisee-invoices/${invoice.id}`)}
                      >
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.franchisee?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.branch?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.balance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentStatusBadge(invoice.payment_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => navigate(`/franchisee-invoices/${invoice.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {!loading && invoices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Total Invoices</div>
              <div className="text-2xl font-bold text-gray-900">{invoices.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Total Amount</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Total Paid</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount), 0))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Outstanding</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(invoices.reduce((sum, inv) => sum + parseFloat(inv.balance), 0))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Opening Balance Modal */}
      <OpeningBalanceModal
        franchisee={selectedFranchiseeForBalance}
        franchisees={franchisees}
        isOpen={showOpeningBalanceModal}
        onClose={() => {
          setShowOpeningBalanceModal(false);
          setSelectedFranchiseeForBalance(null);
        }}
        onSuccess={() => {
          loadInvoices();
          setShowOpeningBalanceModal(false);
          setSelectedFranchiseeForBalance(null);
        }}
      />
    </AdminLayout>
  );
};

export default FranchiseeInvoicesList;
