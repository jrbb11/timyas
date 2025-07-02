import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { accountsService } from '../services/accountsService';
import { supabase } from '../utils/supabaseClient';
import { FaSearch } from 'react-icons/fa';

type DepositType = { id: number; account: string; category: string; amount: number; date: string; description: string };

const Deposits = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editDeposit, setEditDeposit] = useState<DepositType | null>(null);
  const [form, setForm] = useState<any>({ account: '', category: '', amount: '', date: '', description: '' });

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

  return (
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
          <button className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-gray-900 transition ml-auto" style={{minWidth: 120}} onClick={openCreate} type="button">+ Create</button>
        </div>
        <div className="bg-white rounded-xl shadow p-0 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-semibold">Account</th>
                <th className="p-4 text-left font-semibold">Category</th>
                <th className="p-4 text-right font-semibold">Amount</th>
                <th className="p-4 text-left font-semibold">Date</th>
                <th className="p-4 text-left font-semibold">Description</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(dep => (
                <tr key={dep.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{dep.account}</td>
                  <td className="p-4">{dep.category}</td>
                  <td className="p-4 text-right">{Number(dep.amount).toFixed(2)}</td>
                  <td className="p-4">{dep.date}</td>
                  <td className="p-4">{dep.description}</td>
                  <td className="p-4 flex gap-2">
                    <button className="text-blue-600 hover:underline" onClick={() => openEdit(dep)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(dep.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center p-6 text-gray-400">No deposits found.</td></tr>
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
                  <select name="account" value={form.account} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black">
                    {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Category</label>
                  <select name="category" value={form.category} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black">
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
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
      </div>
    </AdminLayout>
  );
};

export default Deposits; 