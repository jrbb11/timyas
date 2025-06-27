import AdminLayout from '../layouts/AdminLayout';
import { FaEdit, FaTrash } from 'react-icons/fa';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../components/ui/Modal';
import { supabase } from '../utils/supabaseClient';
import { brandsService } from '../services/brandsService';

type BrandType = { id: string; name: string; description?: string; image_url?: string; created_at?: string };

const Brand = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<BrandType | null>(null);
  const [form, setForm] = useState({ name: '', description: '', image_url: '' });
  const [brands, setBrands] = useState<BrandType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<BrandType | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const ITEMS_PER_PAGE = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await brandsService.getAll();
      if (error) setError(error.message);
      else setBrands(data || []);
      setLoading(false);
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleCreate = () => {
    setEditData(null);
    setForm({ name: '', description: '', image_url: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (brand: BrandType) => {
    setEditData(brand);
    setForm({ name: brand.name, description: brand.description || '', image_url: brand.image_url || '' });
    setIsModalOpen(true);
  };

  const handleClose = () => setIsModalOpen(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('brand-images').upload(fileName, file);
    if (error) {
      setError(error.message);
      setToast({ message: 'Failed to upload image', type: 'error' });
      setLoading(false);
      return;
    }
    const { publicUrl } = supabase.storage.from('brand-images').getPublicUrl(fileName).data;
    setForm((prev) => ({ ...prev, image_url: publicUrl }));
    setToast({ message: 'Image uploaded', type: 'success' });
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (editData) {
      const { error } = await brandsService.update(editData.id, {
        name: form.name,
        description: form.description,
        image_url: form.image_url,
      });
      if (error) {
        setError(error.message);
        setToast({ message: 'Failed to update brand', type: 'error' });
      } else {
        setToast({ message: 'Brand updated successfully', type: 'success' });
      }
    } else {
      const { error } = await brandsService.create({
        name: form.name,
        description: form.description,
        image_url: form.image_url,
      });
      if (error) {
        setError(error.message);
        setToast({ message: 'Failed to create brand', type: 'error' });
      } else {
        setToast({ message: 'Brand created successfully', type: 'success' });
      }
    }
    const { data, error: fetchError } = await brandsService.getAll();
    if (fetchError) setError(fetchError.message);
    else setBrands(data || []);
    setIsModalOpen(false);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!brandToDelete) return;
    setLoading(true);
    setError(null);
    const { error } = await brandsService.remove(brandToDelete.id);
    if (error) {
      setError(error.message);
      setToast({ message: 'Failed to delete brand', type: 'error' });
    } else {
      setToast({ message: 'Brand deleted successfully', type: 'success' });
    }
    const { data, error: fetchError } = await brandsService.getAll();
    if (fetchError) setError(fetchError.message);
    else setBrands(data || []);
    setIsModalOpen(false);
    setShowDeleteConfirm(false);
    setBrandToDelete(null);
    setLoading(false);
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(search.toLowerCase()) ||
    (brand.description || '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filteredBrands.length / ITEMS_PER_PAGE) || 1;
  const paginatedBrands = filteredBrands.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <AdminLayout
      title="Brand"
      breadcrumb={<span>Products &gt; <span className="text-gray-900">Brand</span></span>}
    >
      <div className="py-6 px-4">
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {loading && <div className="mb-4 text-gray-600 flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Loading...</div>}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search brands..."
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
                <th className="p-3 text-left font-semibold">Brand Image</th>
                <th className="p-3 text-left font-semibold">Brand Name</th>
                <th className="p-3 text-left font-semibold">Brand Description</th>
                <th className="p-3 text-center font-semibold" style={{ width: '110px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBrands.map((brand) => (
                <tr key={brand.id} className="border-b hover:bg-gray-50">
                  <td className="p-3"><input type="checkbox" /></td>
                  <td className="p-3">
                    {brand.image_url ? (
                      <img src={brand.image_url} alt={brand.name} className="w-10 h-10 object-contain rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </td>
                  <td className="p-3">{brand.name}</td>
                  <td className="p-3">{brand.description}</td>
                  <td className="p-3" style={{ minWidth: '110px', height: '100%' }}>
                    <div className="flex gap-2 items-center justify-center h-full">
                      <button
                        className="text-green-600 hover:text-green-800"
                        onClick={() => handleEdit(brand)}
                        disabled={loading}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => { setBrandToDelete(brand); setShowDeleteConfirm(true); }}
                        disabled={loading}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <div>
            {filteredBrands.length === 0 ? (
              <span>No brands found.</span>
            ) : (
              <>
                {((currentPage - 1) * ITEMS_PER_PAGE) + 1}
                {' - '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredBrands.length)}
                {' of '}
                {filteredBrands.length}
                <button
                  className="ml-4 px-2 py-1 border rounded disabled:opacity-50"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  prev
                </button>
                <button
                  className="ml-2 px-2 py-1 border rounded disabled:opacity-50"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  next
                </button>
                <span className="ml-4">Page {currentPage} of {totalPages}</span>
              </>
            )}
          </div>
        </div>
        {/* Modal for create/edit */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleClose}
          title={editData ? 'Edit Brand' : 'Create Brand'}
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Brand Name</label>
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
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Brand Image</label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500"
                disabled={loading}
              />
              {form.image_url && (
                <img src={form.image_url} alt="Brand" className="mt-2 w-20 h-20 object-contain rounded" />
              )}
            </div>
            <div className="flex justify-end gap-2">
              {editData && (
                <button
                  type="button"
                  className="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200"
                  onClick={() => { setBrandToDelete(editData); setShowDeleteConfirm(true); }}
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
          onClose={() => { setShowDeleteConfirm(false); setBrandToDelete(null); }}
          title="Delete Brand"
          footer={
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                onClick={() => { setShowDeleteConfirm(false); setBrandToDelete(null); }}
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
          <p>Are you sure you want to delete this brand?</p>
          <p className="font-semibold mt-2">{brandToDelete?.name}</p>
        </Modal>
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

export default Brand; 