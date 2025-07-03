import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { accountsService } from '../services/accountsService';
import { supabase } from '../utils/supabaseClient';
import { FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import UniversalSelect from '../components/ui/UniversalSelect';

type Account = { id: string; name: string };

const Transfers = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTransfer, setEditTransfer] = useState(null);
  const [form, setForm] = useState<any>({ from: '', to: '', amount: '', date: '', description: '' });
  const [selected, setSelected] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('transfers').select('*').then(({ data }) => setTransfers(data || []));
    accountsService.getAll().then(({ data }) => setAccounts((data || []) as Account[]));
  }, []);

  const filtered: any[] = transfers.filter(t => t.from.toLowerCase().includes(search.toLowerCase()) || t.to.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditTransfer(null);
    setForm({ from: '', to: '', amount: '', date: '', description: '' });
    setModalOpen(true);
  };
  const openEdit = (tr: any) => {
    setEditTransfer(tr);
    setForm({ ...tr });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editTransfer) {
      setTransfers(transfers.map(t => t.id === editTransfer.id ? { ...form, id: editTransfer.id } : t));
    } else {
      setTransfers([...transfers, { ...form, id: Date.now() }]);
    }
    setModalOpen(false);
  };
  const handleDelete = (id: any) => setTransfers(transfers.filter((t: any) => t.id !== id));
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
    const selectedTransfers = transfers.filter(t => selected.includes(t.id));
    const csv = selectedTransfers.map(({ id, from, to, amount, date, description }) => ({ id, from, to, amount, date, description }));
    const csvString = [Object.keys(csv[0]).join(','), ...csv.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'selected_transfers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Transfers" breadcrumb={<span>Finance &gt; <span className="text-gray-900">Transfers</span></span>}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1 flex gap-2 items-center">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search transfers..."
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
                <th className="p-4 text-left font-semibold">From</th>
                <th className="p-4 text-left font-semibold">To</th>
                <th className="p-4 text-right font-semibold">Amount</th>
                <th className="p-4 text-left font-semibold">Date</th>
                <th className="p-4 text-left font-semibold">Description</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tr: any) => (
                <tr key={tr.id} className={`border-b hover:bg-gray-50 ${selected.includes(tr.id) ? 'bg-purple-50' : ''}`}>
                  <td className="p-4">
                    <input type="checkbox" checked={selected.includes(tr.id)} onChange={() => handleSelectRow(tr.id)} />
                  </td>
                  <td className="p-4">{tr.from}</td>
                  <td className="p-4">{tr.to}</td>
                  <td className="p-4 text-right">{Number(tr.amount).toFixed(2)}</td>
                  <td className="p-4">{tr.date}</td>
                  <td className="p-4">{tr.description}</td>
                  <td className="p-4 flex gap-2">
                    <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" onClick={() => openEdit(tr)} title="Edit"><FaEdit size={15} /></button>
                    <button className="p-1 text-red-600 hover:bg-red-100 rounded" onClick={() => handleDelete(tr.id)} title="Delete"><FaTrash size={15} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center p-6 text-gray-400">No transfers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {selected.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex gap-4 items-center border z-50">
            <span className="font-semibold text-gray-700">{selected.length} selected</span>
            <button className="text-gray-700 hover:text-gray-900 font-semibold" onClick={handleExportSelected}>Export Transfers</button>
          </div>
        )}
        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
              <h2 className="text-2xl font-bold mb-6">{editTransfer ? 'Edit' : 'Create'} Transfer</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block mb-1 font-medium text-gray-700">From</label>
                  <UniversalSelect
                    value={accounts.find((acc: Account) => acc.id === form.from) ? { value: form.from, label: accounts.find((acc: Account) => acc.id === form.from)?.name } as import('../components/ui/UniversalSelect').UniversalSelectOption : null}
                    onChange={option => setForm({ ...form, from: option ? option.value : '' })}
                    options={accounts.map((acc: Account) => ({ value: acc.id, label: acc.name }))}
                    placeholder="Select account..."
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">To</label>
                  <UniversalSelect
                    value={accounts.find((acc: Account) => acc.id === form.to) ? { value: form.to, label: accounts.find((acc: Account) => acc.id === form.to)?.name } as import('../components/ui/UniversalSelect').UniversalSelectOption : null}
                    onChange={option => setForm({ ...form, to: option ? option.value : '' })}
                    options={accounts.map((acc: Account) => ({ value: acc.id, label: acc.name }))}
                    placeholder="Select account..."
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
                  {editTransfer && (
                    <button type="button" className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100" onClick={() => handleDelete(editTransfer.id)}>Delete</button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button type="button" className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="bg-black text-white font-semibold rounded-lg px-4 py-2">{editTransfer ? 'Save changes' : 'Add transfer'}</button>
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

export default Transfers; 