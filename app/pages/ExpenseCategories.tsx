import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { FaSearch } from 'react-icons/fa';

const ExpenseCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [selected, setSelected] = useState<any[]>([]);

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditCategory(null);
    setForm({ name: '' });
    setModalOpen(true);
  };
  const openEdit = (cat) => {
    setEditCategory(cat);
    setForm({ name: cat.name });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = e => {
    e.preventDefault();
    if (editCategory) {
      setCategories(categories.map(c => c.id === editCategory.id ? { ...form, id: editCategory.id } : c));
    } else {
      setCategories([...categories, { ...form, id: Date.now() }]);
    }
    setModalOpen(false);
  };
  const handleDelete = id => setCategories(categories.filter(c => c.id !== id));
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(filtered.map(c => c.id));
    } else {
      setSelected([]);
    }
  };
  const handleSelectRow = (id: any) => {
    setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };
  const handleExportSelected = () => {
    const selectedCategories = categories.filter(c => selected.includes(c.id));
    const csv = selectedCategories.map(({ id, name }) => ({ id, name }));
    const csvString = [Object.keys(csv[0]).join(','), ...csv.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'selected_expense_categories.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Expense Categories" breadcrumb={<span>Finance &gt; <span className='text-gray-900'>Expense Categories</span></span>}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1 flex gap-2 items-center">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search categories..."
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
                <th className="p-4 text-left font-semibold">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={handleSelectAll} />
                </th>
                <th className="p-4 text-left font-semibold">Name</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(cat => (
                <tr key={cat.id} className={`border-b hover:bg-gray-50 ${selected.includes(cat.id) ? 'bg-purple-50' : ''}`}>
                  <td className="p-4">
                    <input type="checkbox" checked={selected.includes(cat.id)} onChange={() => handleSelectRow(cat.id)} />
                  </td>
                  <td className="p-4">{cat.name}</td>
                  <td className="p-4 flex gap-2">
                    <button className="text-blue-600 hover:underline" onClick={() => openEdit(cat)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(cat.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={3} className="text-center p-6 text-gray-400">No categories found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {selected.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white border border-gray-200 shadow-lg rounded-xl px-6 py-3 flex items-center gap-4 animate-fade-in">
            <span className="font-semibold text-gray-700">{selected.length} selected</span>
            <button className="bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-900 transition" onClick={handleExportSelected}>Export Categories</button>
            <button className="ml-2 text-gray-500 hover:text-red-500" onClick={() => setSelected([])}>Clear</button>
          </div>
        )}
        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
              <h2 className="text-2xl font-bold mb-6">{editCategory ? 'Edit' : 'Create'} Category</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Name</label>
                  <input name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" required />
                </div>
                <div className="flex items-center justify-between pt-4 gap-2">
                  {editCategory && (
                    <button type="button" className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100" onClick={() => handleDelete(editCategory.id)}>Delete</button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button type="button" className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="bg-black text-white font-semibold rounded-lg px-4 py-2">{editCategory ? 'Save changes' : 'Add category'}</button>
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

export default ExpenseCategories; 