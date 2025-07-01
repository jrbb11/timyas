import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';

const mockAccounts = [
  { id: 1, name: 'Cash', type: 'Asset', balance: 1000.00 },
  { id: 2, name: 'Bank', type: 'Asset', balance: 5000.00 },
  { id: 3, name: 'Credit Card', type: 'Liability', balance: -200.00 },
];

type AccountType = { id: number; name: string; type: string; balance: number };

const Accounts = () => {
  const [accounts, setAccounts] = useState(mockAccounts);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<AccountType | null>(null);
  const [form, setForm] = useState({ name: '', type: 'Asset', balance: 0 });

  const filtered = accounts.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditAccount(null);
    setForm({ name: '', type: 'Asset', balance: 0 });
    setModalOpen(true);
  };
  const openEdit = (acc: AccountType) => {
    setEditAccount(acc);
    setForm({ name: acc.name, type: acc.type, balance: acc.balance });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editAccount) {
      setAccounts(accounts.map(a => a.id === editAccount.id ? { ...a, ...form } : a));
    } else {
      setAccounts([...accounts, { ...form, id: Date.now() }]);
    }
    setModalOpen(false);
  };
  const handleDelete = (id: number) => setAccounts(accounts.filter(a => a.id !== id));

  return (
    <AdminLayout title="Accounts" breadcrumb={<span>Finance &gt; <span className="text-gray-900">Accounts</span></span>}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Accounts</h1>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" onClick={openCreate}>Create</button>
        </div>
        <input
          className="mb-4 p-2 border rounded w-full max-w-xs"
          placeholder="Search accounts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Type</th>
                <th className="text-right p-2">Balance</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(acc => (
                <tr key={acc.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{acc.name}</td>
                  <td className="p-2">{acc.type}</td>
                  <td className="p-2 text-right">{acc.balance.toFixed(2)}</td>
                  <td className="p-2 flex gap-2">
                    <button className="text-blue-600 hover:underline" onClick={() => openEdit(acc)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(acc.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center p-4 text-gray-400">No accounts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
              <h2 className="text-2xl font-bold mb-6">{editAccount ? 'Edit' : 'Create'} Account</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Name</label>
                  <input name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" required />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Type</label>
                  <select name="type" value={form.type} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black">
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Balance</label>
                  <input name="balance" type="number" value={form.balance} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" required />
                </div>
                <div className="flex items-center justify-between pt-4 gap-2">
                  {editAccount && (
                    <button type="button" className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100" onClick={() => handleDelete(editAccount.id)}>Delete</button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button type="button" className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="bg-black text-white font-semibold rounded-lg px-4 py-2">{editAccount ? 'Save changes' : 'Add account'}</button>
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

export default Accounts; 