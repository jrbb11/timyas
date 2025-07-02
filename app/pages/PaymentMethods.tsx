import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { FaSearch, FaEdit, FaTrash } from 'react-icons/fa';

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
  const [selected, setSelected] = useState<any[]>([]);

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
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(filtered.map(m => m.id));
    } else {
      setSelected([]);
    }
  };
  const handleSelectRow = (id: any) => {
    setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };
  const handleExportSelected = () => {
    const selectedMethods = methods.filter(m => selected.includes(m.id));
    const csv = selectedMethods.map(({ id, name }) => ({ id, name }));
    const csvString = [Object.keys(csv[0]).join(','), ...csv.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'selected_payment_methods.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Payment Methods" breadcrumb={<span>Finance &gt; <span className="text-gray-900">Payment Methods</span></span>}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1 flex gap-2 items-center">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search payment methods..."
                className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg w-full text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition"
              />
            </div>
          </div>
          <button className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-gray-900 transition ml-auto" type="button">+ Create</button>
        </div>
        <div className="bg-white rounded-xl shadow p-0 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-semibold">Name</th>
                <th className="p-4 text-left font-semibold">Description</th>
                <th className="p-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {methods.length === 0 ? (
                <tr>
                  <td className="p-6 text-center text-gray-400" colSpan={3}>No payment methods found</td>
                </tr>
              ) : (
                methods.map((method) => (
                  <tr key={method.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{method.name}</td>
                    <td className="p-4">{method.description}</td>
                    <td className="p-4 flex gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Edit"><FaEdit size={15} /></button>
                      <button className="p-1 text-red-600 hover:bg-red-100 rounded" title="Delete"><FaTrash size={15} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {selected.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white border border-gray-200 shadow-lg rounded-xl px-6 py-3 flex items-center gap-4 animate-fade-in">
            <span className="font-semibold text-gray-700">{selected.length} selected</span>
            <button className="bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-900 transition" onClick={handleExportSelected}>Export Methods</button>
            <button className="ml-2 text-gray-500 hover:text-red-500" onClick={() => setSelected([])}>Clear</button>
          </div>
        )}
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