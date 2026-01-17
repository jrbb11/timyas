import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { franchiseeInvoicesService } from '../../services/franchiseeInvoicesService';
import { supabase, getCurrentAppUserId } from '../../utils/supabaseClient';

type FranchiseeOption = {
  people_branches_id: string;
  person_id: string;
  person_name: string;
  branch_id: string;
  branch_name: string;
};

const FranchiseeInvoiceGenerate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [franchisees, setFranchisees] = useState<FranchiseeOption[]>([]);
  const [selectedPeopleBranches, setSelectedPeopleBranches] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [dueDays, setDueDays] = useState(30);
  const [notes, setNotes] = useState('');

  // Preview data
  const [preview, setPreview] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadFranchisees();
    // Set default period to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setPeriodStart(firstDay.toISOString().split('T')[0]);
    setPeriodEnd(lastDay.toISOString().split('T')[0]);
  }, []);

  const loadFranchisees = async () => {
    const { data } = await supabase
      .from('people_branches_view')
      .select('*');

    if (data) {
      const options: FranchiseeOption[] = data.map((pb: any) => ({
        people_branches_id: pb.id,
        person_id: pb.person_id,
        person_name: pb.person_name,
        branch_id: pb.branch_id,
        branch_name: pb.branch_name
      }));
      setFranchisees(options);
    }
  };

  const handlePreview = async () => {
    if (!selectedPeopleBranches || !periodStart || !periodEnd) {
      setError('Please select franchisee and date range');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get sales for the period
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .eq('people_branches_id', selectedPeopleBranches)
        .gte('date', periodStart)
        .lte('date', periodEnd)
        .neq('status', 'cancel');

      if (salesError) throw salesError;

      // Calculate totals
      const subtotal = sales?.reduce((sum, s) => sum + parseFloat(s.total_amount) + parseFloat(s.discount) - parseFloat(s.order_tax), 0) || 0;
      const discount = sales?.reduce((sum, s) => sum + parseFloat(s.discount), 0) || 0;
      const tax = sales?.reduce((sum, s) => sum + parseFloat(s.order_tax), 0) || 0;
      const total = sales?.reduce((sum, s) => sum + parseFloat(s.total_amount), 0) || 0;

      setPreview({
        sales: sales || [],
        salesCount: sales?.length || 0,
        subtotal,
        discount,
        tax,
        total
      });
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPeopleBranches || !periodStart || !periodEnd) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const appUserId = await getCurrentAppUserId();

      console.log('Current app_user_id:', appUserId);

      if (!appUserId) {
        throw new Error('User not found in app_users table. Please contact administrator to create your app_users record.');
      }

      console.log('Generating invoice with created_by:', appUserId);

      const { data, error: genError } = await franchiseeInvoicesService.generateInvoice({
        people_branches_id: selectedPeopleBranches,
        period_start: periodStart,
        period_end: periodEnd,
        due_days: dueDays,
        created_by: appUserId,
        notes: notes || undefined
      });

      if (genError) throw genError;

      setSuccess(true);
      setTimeout(() => {
        navigate(`/franchisee-invoices/${data}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const selectedFranchisee = franchisees.find(f => f.people_branches_id === selectedPeopleBranches);

  return (
    <AdminLayout
      title="Generate Invoice"
      breadcrumb={
        <span>
          Invoicing &gt; Franchisee Invoices &gt; <span className="text-gray-900">Generate</span>
        </span>
      }
    >
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Franchisee Invoice</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              Invoice generated successfully! Redirecting...
            </div>
          )}

          <div className="space-y-6">
            {/* Franchisee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Franchisee / Branch <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedPeopleBranches}
                onChange={(e) => {
                  setSelectedPeopleBranches(e.target.value);
                  setShowPreview(false);
                }}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-black"
                required
              >
                <option value="">Select Franchisee & Branch</option>
                {franchisees.map((f) => (
                  <option key={f.people_branches_id} value={f.people_branches_id}>
                    {f.person_name} - {f.branch_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period Start <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => {
                    setPeriodStart(e.target.value);
                    setShowPreview(false);
                  }}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period End <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => {
                    setPeriodEnd(e.target.value);
                    setShowPreview(false);
                  }}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-black"
                  required
                />
              </div>
            </div>

            {/* Due Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Due (days from invoice date)
              </label>
              <input
                type="number"
                value={dueDays}
                onChange={(e) => setDueDays(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-black"
                min="1"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-black"
                rows={3}
                placeholder="Optional notes for this invoice"
              />
            </div>

            {/* Preview Button */}
            <div className="flex justify-end">
              <button
                onClick={handlePreview}
                disabled={loading || !selectedPeopleBranches || !periodStart || !periodEnd}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Loading...' : 'Preview Invoice'}
              </button>
            </div>

            {/* Preview Section */}
            {showPreview && preview && (
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Invoice Preview</h3>

                <div className="bg-gray-50 rounded-lg p-6 mb-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Franchisee</div>
                      <div className="font-medium">{selectedFranchisee?.person_name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Branch</div>
                      <div className="font-medium">{selectedFranchisee?.branch_name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Period</div>
                      <div className="font-medium">{periodStart} to {periodEnd}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Sales</div>
                      <div className="font-medium">{preview.salesCount} transactions</div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(preview.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-red-600">-{formatCurrency(preview.discount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">{formatCurrency(preview.tax)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-lg font-bold">{formatCurrency(preview.total)}</span>
                    </div>
                  </div>
                </div>

                {preview.salesCount === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
                    No sales found for the selected period. Invoice will be created with zero amount.
                  </div>
                )}

                {/* Generate Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => navigate('/franchisee-invoices')}
                    className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {loading ? 'Generating...' : 'Generate Invoice'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FranchiseeInvoiceGenerate;
