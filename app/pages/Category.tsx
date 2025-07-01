import AdminLayout from '../layouts/AdminLayout';
import { FaEdit, FaTrash } from 'react-icons/fa';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../components/ui/Modal';
import { categoriesService } from '../services/categoriesService';

type CategoryType = { id: string; name: string; description?: string; created_at?: string };

const Category = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<CategoryType | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryType | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch categories from Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await categoriesService.getAll();
      if (error) setError(error.message);
      else setCategories(data || []);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleCreate = () => {
    setEditData(null);
    setForm({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (cat: CategoryType) => {
    setEditData(cat);
    setForm({ name: cat.name, description: cat.description || '' });
    setIsModalOpen(true);
  };

  const handleClose = () => setIsModalOpen(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (editData) {
      const { error } = await categoriesService.update(editData.id, {
        name: form.name,
        description: form.description,
      });
      if (error) {
        setError(error.message);
        setToast({ message: 'Failed to update category', type: 'error' });
      } else {
        setToast({ message: 'Category updated successfully', type: 'success' });
      }
    } else {
      const { error } = await categoriesService.create({
        name: form.name,
        description: form.description,
      });
      if (error) {
        setError(error.message);
        setToast({ message: 'Failed to create category', type: 'error' });
      } else {
        setToast({ message: 'Category created successfully', type: 'success' });
      }
    }
    const { data, error: fetchError } = await categoriesService.getAll();
    if (fetchError) setError(fetchError.message);
    else setCategories(data || []);
    setIsModalOpen(false);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setLoading(true);
    setError(null);
    const { error } = await categoriesService.remove(categoryToDelete.id);
    if (error) {
      setError(error.message);
      setToast({ message: 'Failed to delete category', type: 'error' });
    } else {
      setToast({ message: 'Category deleted successfully', type: 'success' });
    }
    const { data, error: fetchError } = await categoriesService.getAll();
    if (fetchError) setError(fetchError.message);
    else setCategories(data || []);
    setIsModalOpen(false);
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
    setLoading(false);
  };

  // Search and pagination logic
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    (cat.description || '').toLowerCase().includes(search.toLowerCase())
  );
  const totalRows = filteredCategories.length;
  const startRow = totalRows === 0 ? 0 : currentPage * rowsPerPage + 1;
  const endRow = Math.min((currentPage + 1) * rowsPerPage, totalRows);
  const paginatedCategories = filteredCategories.slice(
    currentPage * rowsPerPage,
    currentPage * rowsPerPage + rowsPerPage
  );

  return (
    <AdminLayout
      title="Category"
      breadcrumb={<span>Products &gt; <span className="text-gray-900">Category</span></span>}
    >
      <div className="py-6 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search categories..."
              className="border rounded px-3 py-2 w-full max-w-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            onClick={handleCreate}
            disabled={loading}
          >
            Create
          </button>
        </div>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left font-semibold"><input type="checkbox" /></th>
                <th className="p-3 text-left font-semibold">Category Name</th>
                <th className="p-3 text-left font-semibold">Description</th>
                <th className="p-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.map((cat) => (
                <tr key={cat.id} className="border-b hover:bg-gray-50">
                  <td className="p-3"><input type="checkbox" /></td>
                  <td className="p-3">{cat.name}</td>
                  <td className="p-3">{cat.description || ''}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      className="text-green-600 hover:text-green-800"
                      onClick={() => handleEdit(cat)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => { setCategoryToDelete(cat); setShowDeleteConfirm(true); }}
                      ref={deleteButtonRef}
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
            <select className="ml-2 border rounded px-2 py-1" value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(0); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div>
            {startRow} - {endRow} of {totalRows}
            <button className="ml-4 px-2 py-1" disabled={currentPage === 0} onClick={() => setCurrentPage(p => Math.max(0, p - 1))}>prev</button>
            <button className="ml-2 px-2 py-1" disabled={endRow >= totalRows} onClick={() => setCurrentPage(p => p + 1)}>next</button>
          </div>
        </div>
        <Modal
          isOpen={isModalOpen}
          onClose={handleClose}
          title={editData ? 'Edit Category' : 'Create Category'}
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Category Name</label>
              <input
                className="w-full border rounded px-3 py-2"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full border rounded px-3 py-2"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              {editData && (
                <button
                  type="button"
                  className="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200"
                  onClick={() => { setCategoryToDelete(editData); setShowDeleteConfirm(true); }}
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
          onClose={() => { setShowDeleteConfirm(false); setCategoryToDelete(null); }}
          title="Delete Category"
          footer={
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                onClick={() => { setShowDeleteConfirm(false); setCategoryToDelete(null); }}
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
          <p>Are you sure you want to delete this category?</p>
          <p className="font-semibold mt-2">{categoryToDelete?.name}</p>
        </Modal>
        {loading && <div className="mb-4 text-gray-600 flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Loading...</div>}
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toast.message}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Category; 