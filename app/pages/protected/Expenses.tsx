import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { accountsService } from '../../services/accountsService';
import { supabase } from '../../utils/supabaseClient';
import { FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import UniversalSelect from '../../components/ui/UniversalSelect';
import { PermissionGuard } from '../../components/PermissionComponents';

type ExpenseType = { id: number; account: string; category: string; amount: number; date: string; description: string };

const Expenses = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<ExpenseType | null>(null);
  const [form, setForm] = useState<any>({ account: '', category: '', amount: '', date: '', description: '' });
  const [selected, setSelected] = useState<any[]>([]);

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
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(filtered.map(e => e.id));
    } else {
      setSelected([]);
    }
  };
  const handleSelectRow = (id: any) => {
    setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };
  const handleExportSelected = () => {
    const selectedExpenses = expenses.filter(e => selected.includes(e.id));
    const csv = selectedExpenses.map(({ id, account, category, amount, date, description }) => ({ id, account, category, amount, date, description }));
    const csvString = [Object.keys(csv[0]).join(','), ...csv.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'selected_expenses.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PermissionGuard
      resource="financial"
      action="read"
      fallback={
        <AdminLayout title="Expenses" breadcrumb={<span>Finance &gt; <span className="text-gray-900">Expenses</span></span>}>
          <div className="p-6">
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="text-gray-400">
                <div className="text-6xl mb-4">🔒</div>
                <div className="text-xl font-semibold mb-2">Financial Data Access Restricted</div>
                <div>You don't have permission to view expenses data</div>
              </div>
            </div>
          </div>
        </AdminLayout>
      }
    >
      <AdminLayout title="Expenses" breadcrumb={<span>Finance &gt; <span className="text-gray-900">Expenses</span></span>}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1 flex gap-2 items-center">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search expenses..."
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
            <button className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-gray-900 transition ml-auto" type="button">+ Create</button>
          </PermissionGuard>
        </div>
        <div className="bg-white rounded-xl shadow p-0 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-semibold">Date</th>
                <th className="p-4 text-left font-semibold">Category</th>
                <th className="p-4 text-left font-semibold">Amount</th>
                <th className="p-4 text-left font-semibold">Description</th>
                <th className="p-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td className="p-6 text-center text-gray-400" colSpan={5}>No expenses found</td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{expense.date}</td>
                    <td className="p-4">{expense.category}</td>
                    <td className="p-4">{expense.amount}</td>
                    <td className="p-4">{expense.description}</td>
                    <td className="p-4 flex gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Edit" onClick={() => openEdit(expense)}><FaEdit size={15} /></button>
                      <button className="p-1 text-red-600 hover:bg-red-100 rounded" title="Delete" onClick={() => handleDelete(expense.id)}><FaTrash size={15} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {selected.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex gap-4 items-center border z-50">
            <span className="font-semibold text-gray-700">{selected.length} selected</span>
            <button className="text-gray-700 hover:text-gray-900 font-semibold" onClick={handleExportSelected}>Export Expenses</button>
          </div>
        )}
        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
              <h2 className="text-2xl font-bold mb-6">{editExpense ? 'Edit' : 'Create'} Expense</h2>
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
    </PermissionGuard>
  );
};

export default Expenses; 