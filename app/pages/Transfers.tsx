import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';

const mockTransfers = [
  { id: 1, from: 'Cash', to: 'Bank', amount: 200, date: '2024-07-01', description: 'Transfer to bank' },
  { id: 2, from: 'Bank', to: 'Credit Card', amount: 100, date: '2024-07-02', description: 'Pay credit card' },
];

const mockAccounts = ['Cash', 'Bank', 'Credit Card'];

const Transfers = () => {
  const [transfers, setTransfers] = useState(mockTransfers);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTransfer, setEditTransfer] = useState(null);
  const [form, setForm] = useState({ from: mockAccounts[0], to: mockAccounts[1], amount: '', date: '', description: '' });

  const filtered = transfers.filter(t => t.from.toLowerCase().includes(search.toLowerCase()) || t.to.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditTransfer(null);
    setForm({ from: mockAccounts[0], to: mockAccounts[1], amount: '', date: '', description: '' });
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
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{editTransfer ? 'Edit' : 'Create'} Transfer</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1">From</label>
                  <select name="from" value={form.from} onChange={handleChange} className="w-full border rounded p-2">
                    {mockAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">To</label>
                  <select name="to" value={form.to} onChange={handleChange} className="w-full border rounded p-2">
                    {mockAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Amount</label>
                  <input name="amount" type="number" value={form.amount} onChange={handleChange} className="w-full border rounded p-2" required />
                </div>
                <div>
                  <label className="block mb-1">Date</label>
                  <input name="date" type="date" value={form.date} onChange={handleChange} className="w-full border rounded p-2" required />
                </div>
                <div>
                  <label className="block mb-1">Description</label>
                  <input name="description" value={form.description} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" className="px-4 py-2 rounded border" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="bg-primary text-white px-4 py-2 rounded">{editTransfer ? 'Update' : 'Create'}</button>
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