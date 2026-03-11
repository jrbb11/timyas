import AdminLayout from '../../layouts/AdminLayout';
import { useEffect, useState } from 'react';
import { branchesService } from '../../services/branchesService';
import { FaEdit, FaTrash, FaSearch, FaMapMarkerAlt, FaPlus, FaTimes, FaLink } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Branches = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [isManualCode, setIsManualCode] = useState(false);
  const [editBranch, setEditBranch] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', city: '', country: 'Philippines' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<any | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    const { data, error } = await branchesService.getAll();
    if (error) setError(error.message);
    else setBranches(data || []);
    setLoading(false);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openModal = (branch: any = null) => {
    if (branch) {
      setEditBranch(branch);
      setForm({
        name: branch.name || '',
        code: branch.code || '',
        address: branch.address || '',
        city: branch.city || '',
        country: branch.country || 'Philippines',
      });
      setIsManualCode(true);
    } else {
      setEditBranch(null);
      setForm({ name: '', code: '', address: '', city: '', country: 'Philippines' });
      setIsManualCode(false);
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editBranch) {
        const { error } = await branchesService.update(editBranch.id, form);
        if (error) throw error;
        showToast('Branch updated successfully');
      } else {
        const { error } = await branchesService.create(form);
        if (error) throw error;
        showToast('Branch created successfully');
      }
      setModalOpen(false);
      fetchBranches();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (branch: any) => {
    setBranchToDelete(branch);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;
    setSaving(true);
    try {
      const { error } = await branchesService.remove(branchToDelete.id);
      if (error) throw error;
      showToast('Branch deleted successfully');
      setDeleteConfirmOpen(false);
      fetchBranches();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
      setBranchToDelete(null);
    }
  };

  const filteredBranches = branches.filter(b => 
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.code?.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Branch Management" breadcrumb={<span>Settings &gt; <span className="text-gray-900">Branches</span></span>}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FaSearch />
            </span>
            <input
              type="text"
              placeholder="Search branches..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
               onClick={() => navigate('/settings/people-branches')}
               className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
            >
              <FaLink /> Assignments
            </button>
            <button
              onClick={() => openModal()}
              className="bg-green-600 text-white px-5 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-green-700 transition-all shadow-md shadow-green-100"
            >
              <FaPlus /> Add Branch
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Loading branches...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center border border-red-100 italic">
            {error}
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
            <div className="text-gray-300 mb-4 flex justify-center text-5xl">
              <FaMapMarkerAlt />
            </div>
            <p className="text-gray-500 font-medium">No branches found.</p>
            <button
              onClick={() => openModal()}
              className="text-green-600 font-semibold mt-2 hover:underline"
            >
              Create your first branch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map(branch => (
              <div key={branch.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all flex flex-col relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-green-50 text-green-700 p-3 rounded-xl text-xl">
                    <FaMapMarkerAlt />
                  </div>
                  <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(branch)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => confirmDelete(branch)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{branch.name}</h3>
                <div className="flex gap-2 mb-4">
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {branch.code || 'NO-CODE'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 flex-1">
                  <div className="flex gap-2">
                    <span className="font-semibold text-gray-400 w-16">Address:</span>
                    <span className="flex-1">{branch.address || 'N/A'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-gray-400 w-16">City:</span>
                    <span>{branch.city || 'N/A'}</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    ID: {branch.id.split('-')[0]}
                  </span>
                  <button
                    onClick={() => navigate('/settings/people-branches')}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Manage Staff <FaLink size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editBranch ? 'Edit Branch' : 'Add New Branch'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Branch Name*</label>
                <input
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none transition-all"
                  value={form.name}
                  onChange={e => {
                    const newName = e.target.value;
                    const updatedForm = { ...form, name: newName };
                    if (!editBranch && !isManualCode) {
                      const words = newName.trim().split(/\s+/);
                      let suggestedCode = '';
                      if (words.length > 1) {
                        suggestedCode = words.map(w => w[0]).filter(Boolean).join('').toUpperCase();
                      } else if (newName.length >= 3) {
                        suggestedCode = newName.slice(0, 3).toUpperCase();
                      } else {
                        suggestedCode = newName.toUpperCase();
                      }
                      updatedForm.code = suggestedCode;
                    }
                    setForm(updatedForm);
                  }}
                  placeholder="e.g. Lucban Quezon"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Branch Code</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none transition-all"
                    value={form.code}
                    onChange={e => {
                      setIsManualCode(true);
                      setForm({ ...form, code: e.target.value });
                    }}
                    placeholder="e.g. LB-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none transition-all"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Lucban"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none transition-all resize-none"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Full address of the branch"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (editBranch ? 'Save Changes' : 'Create Branch')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmOpen && branchToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden p-8 animate-in fade-in zoom-in duration-200">
            <div className="bg-red-50 text-red-600 w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              <FaTrash />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Branch?</h3>
            <p className="text-gray-500 text-center mb-8">
              Are you sure you want to delete <span className="font-bold text-gray-700">{branchToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="py-3 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-6 py-3 rounded-2xl shadow-2xl text-white font-bold animate-in slide-in-from-right duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </AdminLayout>
  );
};

export default Branches;
