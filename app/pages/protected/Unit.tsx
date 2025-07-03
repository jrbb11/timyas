import AdminLayout from '../../layouts/AdminLayout';
import { FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../../components/ui/Modal';
import { unitsService } from '../../services/unitsService';
import UniversalSelect from '../../components/ui/UniversalSelect';

type UnitType = {
  id: string;
  name: string;
  short_name: string;
  base_unit?: string;
  operator?: string;
  operation_value: number;
  created_at?: string;
};

const Unit = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<UnitType | null>(null);
  const [form, setForm] = useState({ name: '', short_name: '', base_unit: '', operator: '*', operation_value: 1 });
  const [units, setUnits] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<UnitType | null>(null);
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selected, setSelected] = useState<any[]>([]);

  useEffect(() => {
    const fetchUnits = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await unitsService.getAll();
      if (error) setError(error.message);
      else setUnits(data || []);
      setLoading(false);
    };
    fetchUnits();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleCreate = () => {
    setEditData(null);
    setForm({ name: '', short_name: '', base_unit: '', operator: '*', operation_value: 1 });
    setIsModalOpen(true);
  };

  const handleEdit = (unit: UnitType) => {
    setEditData(unit);
    setForm({
      name: unit.name,
      short_name: unit.short_name,
      base_unit: unit.base_unit || '',
      operator: unit.operator || '*',
      operation_value: unit.operation_value,
    });
    setIsModalOpen(true);
  };

  const handleClose = () => setIsModalOpen(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (editData) {
      const { error } = await unitsService.update(editData.id, {
        name: form.name,
        short_name: form.short_name,
        base_unit: form.base_unit,
        operator: form.operator,
        operation_value: Number(form.operation_value),
      });
      if (error) {
        setError(error.message);
        setToast({ message: 'Failed to update unit', type: 'error' });
      } else {
        setToast({ message: 'Unit updated successfully', type: 'success' });
      }
    } else {
      const { error } = await unitsService.create({
        name: form.name,
        short_name: form.short_name,
        base_unit: form.base_unit,
        operator: form.operator,
        operation_value: Number(form.operation_value),
      });
      if (error) {
        setError(error.message);
        setToast({ message: 'Failed to create unit', type: 'error' });
      } else {
        setToast({ message: 'Unit created successfully', type: 'success' });
      }
    }
    const { data, error: fetchError } = await unitsService.getAll();
    if (fetchError) setError(fetchError.message);
    else setUnits(data || []);
    setIsModalOpen(false);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!unitToDelete) return;
    setLoading(true);
    setError(null);
    const { error } = await unitsService.remove(unitToDelete.id);
    if (error) {
      setError(error.message);
      setToast({ message: 'Failed to delete unit', type: 'error' });
    } else {
      setToast({ message: 'Unit deleted successfully', type: 'success' });
    }
    const { data, error: fetchError } = await unitsService.getAll();
    if (fetchError) setError(fetchError.message);
    else setUnits(data || []);
    setIsModalOpen(false);
    setShowDeleteConfirm(false);
    setUnitToDelete(null);
    setLoading(false);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(paginatedUnits.map(u => u.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectRow = (id: any) => {
    setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const handleExportSelectedUnits = () => {
    const selectedUnits = units.filter(u => selected.includes(u.id));
    const csv = selectedUnits.map(({ id, name, short_name, base_unit, operator, operation_value, created_at }) => ({ id, name, short_name, base_unit, operator, operation_value, created_at }));
    const csvString = [Object.keys(csv[0]).join(','), ...csv.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'selected_units.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(search.toLowerCase()) ||
    unit.short_name.toLowerCase().includes(search.toLowerCase()) ||
    (unit.base_unit || '').toLowerCase().includes(search.toLowerCase())
  );
  const totalRows = filteredUnits.length;
  const startRow = totalRows === 0 ? 0 : currentPage * rowsPerPage + 1;
  const endRow = Math.min((currentPage + 1) * rowsPerPage, totalRows);
  const paginatedUnits = filteredUnits.slice(
    currentPage * rowsPerPage,
    currentPage * rowsPerPage + rowsPerPage
  );

  return (
    <AdminLayout
      title="Unit"
      breadcrumb={<span>Products &gt; <span className="text-gray-900">Unit</span></span>}
    >
      <div className="py-6 px-4">
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {loading && <div className="mb-4 text-gray-600 flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Loading...</div>}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex-1 flex gap-2 items-center">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search units..."
                className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg w-full text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ boxShadow: 'none' }}
                disabled={loading}
              />
            </div>
          </div>
          <button
            className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-gray-900 transition ml-auto"
            style={{minWidth: 120}}
            onClick={handleCreate}
            disabled={loading}
            type="button"
          >
            + Create
          </button>
        </div>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left font-semibold">
                  <input type="checkbox" checked={selected.length === paginatedUnits.length && paginatedUnits.length > 0} onChange={handleSelectAll} />
                </th>
                <th className="p-3 text-left font-semibold">Name</th>
                <th className="p-3 text-left font-semibold">Short Name</th>
                <th className="p-3 text-left font-semibold">Base Unit</th>
                <th className="p-3 text-left font-semibold">Operator</th>
                <th className="p-3 text-left font-semibold">Operation Value</th>
                <th className="p-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUnits.map((unit) => (
                <tr key={unit.id} className={`border-b hover:bg-gray-50 ${selected.includes(unit.id) ? 'bg-blue-50' : ''}`}>
                  <td className="p-3">
                    <input type="checkbox" checked={selected.includes(unit.id)} onChange={() => handleSelectRow(unit.id)} />
                  </td>
                  <td className="p-3">{unit.name}</td>
                  <td className="p-3">{unit.short_name}</td>
                  <td className="p-3">{unit.base_unit}</td>
                  <td className="p-3">{unit.operator}</td>
                  <td className="p-3">{unit.operation_value}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      className="text-green-600 hover:text-green-800"
                      onClick={() => handleEdit(unit)}
                      disabled={loading}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => { setUnitToDelete(unit); setShowDeleteConfirm(true); }}
                      disabled={loading}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <div>
            Rows per page:
            <UniversalSelect
              value={{ value: String(rowsPerPage), label: String(rowsPerPage) }}
              onChange={option => {
                if (option) {
                  setRowsPerPage(Number(option.value));
                  setCurrentPage(0);
                }
              }}
              options={[
                { value: "10", label: "10" },
                { value: "25", label: "25" },
                { value: "50", label: "50" }
              ]}
              isSearchable={false}
              menuPlacement="auto"
            />
          </div>
          <div>
            {startRow} - {endRow} of {totalRows}
            <button className="ml-4 px-2 py-1" disabled={currentPage === 0} onClick={() => setCurrentPage(p => Math.max(0, p - 1))}>prev</button>
            <button className="ml-2 px-2 py-1" disabled={endRow >= totalRows} onClick={() => setCurrentPage(p => p + 1)}>next</button>
          </div>
        </div>
        {/* Modal for create/edit */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleClose}
          title={editData ? 'Edit Unit' : 'Create Unit'}
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                className="w-full border rounded px-3 py-2"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Short Name</label>
              <input
                className="w-full border rounded px-3 py-2"
                name="short_name"
                value={form.short_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Base Unit</label>
              <input
                className="w-full border rounded px-3 py-2"
                name="base_unit"
                value={form.base_unit}
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Operator</label>
              <UniversalSelect
                value={{ value: form.operator, label: form.operator }}
                onChange={option => {
                  if (option) setForm({ ...form, operator: option.value });
                }}
                options={[
                  { value: '*', label: '*' },
                  { value: '/', label: '/' }
                ]}
                isSearchable={false}
                menuPlacement="auto"
                placeholder="Select operator"
                menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Operation Value</label>
              <input
                className="w-full border rounded px-3 py-2"
                name="operation_value"
                type="number"
                value={form.operation_value}
                onChange={handleChange}
                required
                min={0.0001}
                step={0.0001}
              />
            </div>
            <div className="flex justify-end gap-2">
              {editData && (
                <button
                  type="button"
                  className="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200"
                  onClick={() => { setUnitToDelete(editData); setShowDeleteConfirm(true); }}
                  disabled={loading}
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => { setShowDeleteConfirm(false); setUnitToDelete(null); }}
          title="Delete Unit"
          footer={
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                onClick={() => { setShowDeleteConfirm(false); setUnitToDelete(null); }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          }
        >
          <p>Are you sure you want to delete this unit?</p>
          <p className="font-semibold mt-2">{unitToDelete?.name}</p>
        </Modal>
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toast.message}
          </div>
        )}
        {selected.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex gap-4 items-center border z-50">
            <span className="font-semibold text-gray-700">{selected.length} selected</span>
            <button className="text-gray-700 hover:text-gray-900 font-semibold" onClick={handleExportSelectedUnits}>Export Units</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Unit; 