import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { accountsService } from '../services/accountsService';
import { supabase } from '../utils/supabaseClient';

const Transfers = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTransfer, setEditTransfer] = useState(null);
  const [form, setForm] = useState<any>({ from: '', to: '', amount: '', date: '', description: '' });

  useEffect(() => {
    supabase.from('transfers').select('*').then(({ data }) => setTransfers(data || []));
    accountsService.getAll().then(({ data }) => setAccounts(data || []));
  }, []);

  const filtered = transfers.filter(t => t.from.toLowerCase().includes(search.toLowerCase()) || t.to.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditTransfer(null);
    setForm({ from: '', to: '', amount: '', date: '', description: '' });
    setModalOpen(true);
  };
  const openEdit = (tr) => {
    setEditTransfer(tr);
    setForm({ ...tr });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = e => {
    e.preventDefault();
    if (editTransfer) {
      setTransfers(transfers.map(t => t.id === editTransfer.id ? { ...form, id: editTransfer.id } : t));
    } else {
      setTransfers([...transfers, { ...form, id: Date.now() }]);
    }
    setModalOpen(false);
  };
  const handleDelete = id => setTransfers(transfers.filter(t => t.id !== id));

  return (
    <AdminLayout title="Transfers" breadcrumb={<span>Finance &gt; <span className="text-gray-900">Transfers</span></span>}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Transfers</h1>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" onClick={openCreate}>Create</button>
        </div>
        <input
          className="mb-4 p-2 border rounded w-full max-w-xs"
          placeholder="Search transfers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">From</th>
                <th className="text-left p-2">To</th>
                <th className="text-right p-2">Amount</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Description</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tr => (
                <tr key={tr.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{tr.from}</td>
                  <td className="p-2">{tr.to}</td>
                  <td className="p-2 text-right">{Number(tr.amount).toFixed(2)}</td>
                  <td className="p-2">{tr.date}</td>
                  <td className="p-2">{tr.description}</td>
                  <td className="p-2 flex gap-2">
                    <button className="text-blue-600 hover:underline" onClick={() => openEdit(tr)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(tr.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center p-4 text-gray-400">No transfers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
              <h2 className="text-2xl font-bold mb-6">{editTransfer ? 'Edit' : 'Create'} Transfer</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block mb-1 font-medium text-gray-700">From</label>
                  <select name="from" value={form.from} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black">
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">To</label>
                  <select name="to" value={form.to} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black">
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
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
                  {editTransfer && (
                    <button type="button" className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100" onClick={() => handleDelete(editTransfer.id)}>Delete</button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button type="button" className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="bg-black text-white font-semibold rounded-lg px-4 py-2">{editTransfer ? 'Save changes' : 'Add transfer'}</button>
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

export default Transfers; 