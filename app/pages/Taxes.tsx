import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';

const mockTaxes = [
  { id: 1, name: 'VAT', rate: 12 },
  { id: 2, name: 'Service Tax', rate: 5 },
];

type TaxType = { id: number; name: string; rate: number };

const Taxes = () => {
  const [taxes, setTaxes] = useState(mockTaxes);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTax, setEditTax] = useState<TaxType | null>(null);
  const [form, setForm] = useState({ name: '', rate: '' });

  const filtered = taxes.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditTax(null);
    setForm({ name: '', rate: '' });
    setModalOpen(true);
  };
  const openEdit = (tax: TaxType) => {
    setEditTax(tax);
    setForm({ name: tax.name, rate: tax.rate.toString() });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editTax) {
      setTaxes(taxes.map(t => t.id === editTax.id ? { ...form, id: editTax.id, rate: Number(form.rate) } : t));
    } else {
      setTaxes([...taxes, { ...form, id: Date.now(), rate: Number(form.rate) }]);
    }
    setModalOpen(false);
  };
  const handleDelete = (id: number) => setTaxes(taxes.filter(t => t.id !== id));

  return (
    <AdminLayout title="Taxes" breadcrumb={<span>Finance &gt; <span className='text-gray-900'>Taxes</span></span>}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Taxes</h1>
        <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" onClick={openCreate}>Create</button>
      </div>
      <input
        className="mb-4 p-2 border rounded w-full max-w-xs"
        placeholder="Search taxes..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="bg-white rounded shadow p-4 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Name</th>
              <th className="text-right p-2">Rate (%)</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(tax => (
              <tr key={tax.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{tax.name}</td>
                <td className="p-2 text-right">{tax.rate}</td>
                <td className="p-2 flex gap-2">
                  <button className="text-blue-600 hover:underline" onClick={() => openEdit(tax)}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(tax.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={3} className="text-center p-4 text-gray-400">No taxes found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
            <h2 className="text-2xl font-bold mb-6">{editTax ? 'Edit' : 'Create'} Tax</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-1 font-medium text-gray-700">Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" required />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">Rate (%)</label>
                <input name="rate" type="number" value={form.rate} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" required />
              </div>
              <div className="flex items-center justify-between pt-4 gap-2">
                {editTax && (
                  <button type="button" className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100" onClick={() => handleDelete(editTax.id)}>Delete</button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button type="button" className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="bg-black text-white font-semibold rounded-lg px-4 py-2">{editTax ? 'Save changes' : 'Add tax'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Taxes; 