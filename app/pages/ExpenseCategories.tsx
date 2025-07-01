import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';

const mockCategories = [
  { id: 1, name: 'Office' },
  { id: 2, name: 'Utilities' },
];

const ExpenseCategories = () => {
  const [categories, setCategories] = useState(mockCategories);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [form, setForm] = useState({ name: '' });

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

  return (
    <AdminLayout title="Expense Categories" breadcrumb={<span>Finance &gt; <span className='text-gray-900'>Expense Categories</span></span>}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Expense Categories</h1>
        <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" onClick={openCreate}>Create</button>
      </div>
      <input
        className="mb-4 p-2 border rounded w-full max-w-xs"
        placeholder="Search categories..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="bg-white rounded shadow p-4 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Name</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(cat => (
              <tr key={cat.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{cat.name}</td>
                <td className="p-2 flex gap-2">
                  <button className="text-blue-600 hover:underline" onClick={() => openEdit(cat)}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(cat.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={2} className="text-center p-4 text-gray-400">No categories found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editCategory ? 'Edit' : 'Create'} Category</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1">Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded p-2" required />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 rounded border" onClick={closeModal}>Cancel</button>
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded">{editCategory ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ExpenseCategories; 