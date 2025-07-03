import AdminLayout from '../layouts/AdminLayout';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersService } from '../services/customersService';
import { branchesService } from '../services/branchesService';
import { supabase } from '../utils/supabaseClient';

type BranchForm = { name: string; code: string; address: string; city: string; country: string };

const FranchiseeCreate = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', country: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [branches, setBranches] = useState<BranchForm[]>([
    { name: '', code: '', address: '', city: '', country: '' }
  ]);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBranchChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBranches(prev => prev.map((b, i) => i === idx ? { ...b, [name]: value } : b));
  };

  const addBranch = () => {
    setBranches([...branches, { name: '', code: '', address: '', city: '', country: '' }]);
  };

  const removeBranch = (idx: number) => {
    if (branches.length === 1) return;
    setBranches(branches.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    // 1. Create franchisee
    const { data: franchiseeRes, error: franchiseeError } = await customersService.create(form);
    const franchiseeArr = franchiseeRes as { id: string }[] | null;
    if (franchiseeError || !franchiseeArr || !franchiseeArr[0]?.id) {
      setLoading(false);
      setError(franchiseeError?.message || 'Failed to create franchisee');
      return;
    }
    const person_id = franchiseeArr[0].id;
    // 2. Create branches and assign
    try {
      for (const branch of branches) {
        const { data: branchRes, error: branchError } = await branchesService.create(branch);
        const branchArr = branchRes as { id: string }[] | null;
        if (branchError || !branchArr || !branchArr[0]?.id) {
          throw new Error(branchError?.message || 'Failed to create branch');
        }
        const branch_id = branchArr[0].id;
        // Assign to franchisee
        const { error: assignError } = await supabase.from('people_branches').insert([{ person_id, branch_id }]);
        if (assignError) throw new Error(assignError.message);
      }
      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate('/customers'), 1200);
    } catch (err: any) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <AdminLayout title="Add Franchisee" breadcrumb={<span>Franchisee &gt; <span className="text-gray-900">Add Franchisee</span></span>}>
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-8 mt-8">
        <h2 className="text-2xl font-bold mb-6">Add Franchisee</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" required />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Email</label>
            <input name="email" value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" type="email" />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Address</label>
            <input name="address" value={form.address} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">City</label>
            <input name="city" value={form.city} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Country</label>
            <input name="country" value={form.country} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Branches</h3>
            {branches.map((branch, idx) => (
              <div key={idx} className="border rounded-lg p-4 mb-4 bg-gray-50 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium text-gray-700">Branch Name</label>
                    <input name="name" value={branch.name} onChange={e => handleBranchChange(idx, e)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" required />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-gray-700">Branch Code</label>
                    <input name="code" value={branch.code} onChange={e => handleBranchChange(idx, e)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-gray-700">Address</label>
                    <input name="address" value={branch.address} onChange={e => handleBranchChange(idx, e)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-gray-700">City</label>
                    <input name="city" value={branch.city} onChange={e => handleBranchChange(idx, e)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-gray-700">Country</label>
                    <input name="country" value={branch.country} onChange={e => handleBranchChange(idx, e)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
                  </div>
                </div>
                {branches.length > 1 && (
                  <button type="button" className="absolute top-2 right-2 text-red-500 hover:text-red-700" onClick={() => removeBranch(idx)} title="Remove Branch">&times;</button>
                )}
              </div>
            ))}
            <button type="button" className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold mt-2" onClick={addBranch}>+ Add Branch</button>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button type="button" className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold" onClick={() => navigate('/customers')} disabled={loading}>Cancel</button>
            <button type="submit" className="bg-black text-white font-semibold rounded-lg px-4 py-2" disabled={loading}>{loading ? 'Saving...' : 'Save Franchisee'}</button>
          </div>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          {success && <div className="text-green-600 text-sm mt-2">Franchisee added! Redirecting...</div>}
        </form>
      </div>
    </AdminLayout>
  );
};

export default FranchiseeCreate; 