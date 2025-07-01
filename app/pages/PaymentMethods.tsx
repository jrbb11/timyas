import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';

type MethodType = { id: number; name: string };

const mockMethods = [
  { id: 1, name: 'Cash' },
  { id: 2, name: 'Bank Transfer' },
  { id: 3, name: 'Credit Card' },
];

const PaymentMethods = () => {
  const [methods, setMethods] = useState(mockMethods);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMethod, setEditMethod] = useState<MethodType | null>(null);
  const [form, setForm] = useState({ name: '' });

  const filtered = methods.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditMethod(null);
    setForm({ name: '' });
    setModalOpen(true);
  };
  const openEdit = (m: MethodType) => {
    setEditMethod(m);
    setForm({ name: m.name });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editMethod) {
      setMethods(methods.map(m => m.id === editMethod.id ? { ...form, id: editMethod.id } : m));
    } else {
      setMethods([...methods, { ...form, id: Date.now() }]);
    }
    setModalOpen(false);
  };
  const handleDelete = (id: number) => setMethods(methods.filter(m => m.id !== id));

  return (
    <AdminLayout title="Payment Methods" breadcrumb={<span>Finance &gt; <span className="text-gray-900">Payment Methods</span></span>}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" onClick={openCreate}>Create</button>
        </div>
        <input
          className="mb-4 p-2 border rounded w-full max-w-xs"
          placeholder="Search methods..."
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
              {filtered.map(m => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{m.name}</td>
                  <td className="p-2 flex gap-2">
                    <button className="text-blue-600 hover:underline" onClick={() => openEdit(m)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(m.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={2} className="text-center p-4 text-gray-400">No payment methods found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
              <h2 className="text-2xl font-bold mb-6">{editMethod ? 'Edit' : 'Create'} Payment Method</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Name</label>
                  <input name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" required />
                </div>
                <div className="flex items-center justify-between pt-4 gap-2">
                  {editMethod && (
                    <button type="button" className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100" onClick={() => handleDelete(editMethod.id)}>Delete</button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button type="button" className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="bg-black text-white font-semibold rounded-lg px-4 py-2">{editMethod ? 'Save changes' : 'Add method'}</button>
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

export default PaymentMethods; 