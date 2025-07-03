import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { FaSearch, FaEdit, FaTrash } from 'react-icons/fa';

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
  const [selected, setSelected] = useState<any[]>([]);

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
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(filtered.map(t => t.id));
    } else {
      setSelected([]);
    }
  };
  const handleSelectRow = (id: any) => {
    setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };
  const handleExportSelected = () => {
    const selectedTaxes = taxes.filter(t => selected.includes(t.id));
    const csv = selectedTaxes.map(({ id, name, rate }) => ({ id, name, rate }));
    const csvString = [Object.keys(csv[0]).join(','), ...csv.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'selected_taxes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Taxes" breadcrumb={<span>Finance &gt; <span className='text-gray-900'>Taxes</span></span>}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1 flex gap-2 items-center">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search taxes..."
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
                <th className="p-4 text-right font-semibold">Rate (%)</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tax => (
                <tr key={tax.id} className={`border-b hover:bg-gray-50 ${selected.includes(tax.id) ? 'bg-purple-50' : ''}`}>
                  <td className="p-4">
                    <input type="checkbox" checked={selected.includes(tax.id)} onChange={() => handleSelectRow(tax.id)} />
                  </td>
                  <td className="p-4">{tax.name}</td>
                  <td className="p-4 text-right">{tax.rate}</td>
                  <td className="p-4 flex gap-2">
                    <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Edit" onClick={() => openEdit(tax)}><FaEdit size={15} /></button>
                    <button className="p-1 text-red-600 hover:bg-red-100 rounded" title="Delete" onClick={() => handleDelete(tax.id)}><FaTrash size={15} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center p-6 text-gray-400">No taxes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {selected.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white border border-gray-200 shadow-lg rounded-xl px-6 py-3 flex items-center gap-4 animate-fade-in">
            <span className="font-semibold text-gray-700">{selected.length} selected</span>
            <button className="bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-900 transition" onClick={handleExportSelected}>Export Taxes</button>
            <button className="ml-2 text-gray-500 hover:text-red-500" onClick={() => setSelected([])}>Clear</button>
          </div>
        )}
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
      </div>
    </AdminLayout>
  );
};

export default Taxes; 