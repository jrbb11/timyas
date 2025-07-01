import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { accountsService } from '../services/accountsService';
import { supabase } from '../utils/supabaseClient';

type ExpenseType = { id: number; account: string; category: string; amount: number; date: string; description: string };

const Expenses = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<ExpenseType | null>(null);
  const [form, setForm] = useState<any>({ account: '', category: '', amount: '', date: '', description: '' });

  useEffect(() => {
    supabase.from('expenses').select('*').then(({ data }) => setExpenses(data || []));
    supabase.from('expense_categories').select('*').then(({ data }) => setCategories(data || []));
    accountsService.getAll().then(({ data }) => setAccounts(data || []));
  }, []);

  const filtered = expenses.filter(e => e.account.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditExpense(null);
    setForm({ account: '', category: '', amount: '', date: '', description: '' });
    setModalOpen(true);
  };
  const openEdit = (exp: ExpenseType) => {
    setEditExpense(exp);
    setForm({ ...exp, amount: exp.amount.toString() });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editExpense) {
      setExpenses(expenses.map(e => e.id === editExpense.id ? { ...form, id: editExpense.id, amount: Number(form.amount) } : e));
    } else {
      setExpenses([...expenses, { ...form, id: Date.now(), amount: Number(form.amount) }]);
    }
    setModalOpen(false);
  };
  const handleDelete = (id: number) => setExpenses(expenses.filter(e => e.id !== id));

  return (
    <AdminLayout title="Expenses" breadcrumb={<span>Finance &gt; <span className="text-gray-900">Expenses</span></span>}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Expenses</h1>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" onClick={openCreate}>Create</button>
        </div>
        <input
          className="mb-4 p-2 border rounded w-full max-w-xs"
          placeholder="Search expenses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Account</th>
                <th className="text-left p-2">Category</th>
                <th className="text-right p-2">Amount</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Description</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(exp => (
                <tr key={exp.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{exp.account}</td>
                  <td className="p-2">{exp.category}</td>
                  <td className="p-2 text-right">{Number(exp.amount).toFixed(2)}</td>
                  <td className="p-2">{exp.date}</td>
                  <td className="p-2">{exp.description}</td>
                  <td className="p-2 flex gap-2">
                    <button className="text-blue-600 hover:underline" onClick={() => openEdit(exp)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(exp.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center p-4 text-gray-400">No expenses found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
              <h2 className="text-2xl font-bold mb-6">{editExpense ? 'Edit' : 'Create'} Expense</h2>
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
                  {editExpense && (
                    <button type="button" className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100" onClick={() => handleDelete(editExpense.id)}>Delete</button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button type="button" className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="bg-black text-white font-semibold rounded-lg px-4 py-2">{editExpense ? 'Save changes' : 'Add expense'}</button>
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

export default Expenses; 