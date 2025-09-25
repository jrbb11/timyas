import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { accountsService } from '../../services/accountsService';
import { supabase } from '../../utils/supabaseClient';
import { FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import UniversalSelect from '../../components/ui/UniversalSelect';
import { PermissionGuard } from '../../components/PermissionComponents';

type DepositType = { id: number; account: string; category: string; amount: number; date: string; description: string };

const Deposits = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editDeposit, setEditDeposit] = useState<DepositType | null>(null);
  const [form, setForm] = useState<any>({ account: '', category: '', amount: '', date: '', description: '' });
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    supabase.from('deposits').select('*').then(({ data }) => setDeposits(data || []));
    supabase.from('deposit_categories').select('*').then(({ data }) => setCategories(data || []));
    accountsService.getAll().then(({ data }) => setAccounts(data || []));
  }, []);

  const filtered = deposits.filter(d => d.account.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditDeposit(null);
    setForm({ account: '', category: '', amount: '', date: '', description: '' });
    setModalOpen(true);
  };
  const openEdit = (dep: DepositType) => {
    setEditDeposit(dep);
    setForm({ ...dep, amount: dep.amount.toString() });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editDeposit) {
      setDeposits(deposits.map(d => d.id === editDeposit.id ? { ...form, id: editDeposit.id, amount: Number(form.amount) } : d));
    } else {
      setDeposits([...deposits, { ...form, id: Date.now(), amount: Number(form.amount) }]);
    }
    setModalOpen(false);
  };
  const handleDelete = (id: number) => setDeposits(deposits.filter(d => d.id !== id));
  const handleExportSelected = () => {
    // Implementation of export selected deposits
  };

  return (
    <PermissionGuard
      resource="financial"
      action="read"
      fallback={
        <AdminLayout title="Deposits" breadcrumb={<span>Finance &gt; <span className="text-gray-900">Deposits</span></span>}>
          <div className="p-6">
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="text-gray-400">
                <div className="text-6xl mb-4">🔒</div>
                <div className="text-xl font-semibold mb-2">Financial Data Access Restricted</div>
                <div>You don't have permission to view deposits data</div>
              </div>
            </div>
          </div>
        </AdminLayout>
      }
    >
      <AdminLayout title="Deposits" breadcrumb={<span>Finance &gt; <span className="text-gray-900">Deposits</span></span>}>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex-1 flex gap-2 items-center">
              <div className="relative w-full max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  placeholder="Search deposits..."
                  className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg w-full text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <PermissionGuard
              resource="financial"
              action="manage"
              fallback={<div></div>}
            >
              <button className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-gray-900 transition ml-auto" style={{minWidth: 120}} onClick={openCreate} type="button">+ Create</button>
            </PermissionGuard>
          </div>
        <div className="bg-white rounded-xl shadow p-0 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-semibold"><input type="checkbox" /></th>
                <th className="p-4 text-left font-semibold">Date</th>
                <th className="p-4 text-left font-semibold">Account</th>
                <th className="p-4 text-left font-semibold">Amount</th>
                <th className="p-4 text-left font-semibold">Description</th>
                <th className="p-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deposits.length === 0 ? (
                <tr>
                  <td className="p-6 text-center text-gray-400" colSpan={6}>No deposits found</td>
                </tr>
              ) : (
                deposits.map((deposit) => (
                  <tr key={deposit.id} className="border-b hover:bg-gray-50">
                    <td className="p-4"><input type="checkbox" /></td>
                    <td className="p-4">{deposit.date}</td>
                    <td className="p-4">{deposit.account}</td>
                    <td className="p-4">{deposit.amount}</td>
                    <td className="p-4">{deposit.description}</td>
                    <td className="p-4 flex gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Edit" onClick={() => openEdit(deposit)}><FaEdit size={15} /></button>
                      <button className="p-1 text-red-600 hover:bg-red-100 rounded" title="Delete" onClick={() => handleDelete(deposit.id)}><FaTrash size={15} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
              <h2 className="text-2xl font-bold mb-6">{editDeposit ? 'Edit' : 'Create'} Deposit</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Account</label>
                  <UniversalSelect
                    value={accounts.find((acc: any) => acc.name === form.account) ? { value: form.account, label: form.account } : null}
                    onChange={option => setForm({ ...form, account: option ? option.value : '' })}
                    options={accounts.map((acc: any) => ({ value: acc.name, label: acc.name }))}
                    placeholder="Select account..."
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Category</label>
                  <UniversalSelect
                    value={categories.find((cat: any) => cat.name === form.category) ? { value: form.category, label: form.category } : null}
                    onChange={option => setForm({ ...form, category: option ? option.value : '' })}
                    options={categories.map((cat: any) => ({ value: cat.name, label: cat.name }))}
                    placeholder="Select category..."
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Amount</label>
                  <input name="amount" type="number" value={form.amount} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" required />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Date</label>
                  <input name="date" type="date" value={form.date} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" required />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Description</label>
                  <input name="description" value={form.description} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
                </div>
                <div className="flex items-center justify-between pt-4 gap-2">
                  {editDeposit && (
                    <button type="button" className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100" onClick={() => handleDelete(editDeposit.id)}>Delete</button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button type="button" className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="bg-black text-white font-semibold rounded-lg px-4 py-2">{editDeposit ? 'Save changes' : 'Add deposit'}</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
        {selected.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex gap-4 items-center border z-50">
            <span className="font-semibold text-gray-700">{selected.length} selected</span>
            <button className="text-gray-700 hover:text-gray-900 font-semibold" onClick={handleExportSelected}>Export Deposits</button>
          </div>
        )}
      </div>
    </AdminLayout>
    </PermissionGuard>
  );
};

export default Deposits; 