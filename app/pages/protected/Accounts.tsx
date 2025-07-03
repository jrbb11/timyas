import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { accountsService } from '../../services/accountsService';
import { FaSearch } from 'react-icons/fa';

type AccountType = { id: number; name: string; type: string; balance: number };

const Accounts = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<AccountType | null>(null);
  const [form, setForm] = useState<any>({ name: '', type: 'Asset', balance: 0 });

  useEffect(() => {
    accountsService.getAll().then(({ data }) => setAccounts(data || []));
  }, []);

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1 flex gap-2 items-center">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search accounts..."
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
                <th className="p-4 text-left font-semibold">Name</th>
                <th className="p-4 text-left font-semibold">Type</th>
                <th className="p-4 text-right font-semibold">Balance</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(acc => (
                <tr key={acc.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{acc.name}</td>
                  <td className="p-4">{acc.type}</td>
                  <td className="p-4 text-right">{acc.balance.toFixed(2)}</td>
                  <td className="p-4 flex gap-2">
                    <button className="text-blue-600 hover:underline" onClick={() => openEdit(acc)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(acc.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center p-6 text-gray-400">No accounts found.</td></tr>
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