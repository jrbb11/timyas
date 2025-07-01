import AdminLayout from '../layouts/AdminLayout';
import { useEffect, useState } from 'react';
import { customersService } from '../services/customersService';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import Modal from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const Customers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [viewCustomer, setViewCustomer] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', address: '', city: '', country: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', email: '', phone: '', address: '', city: '', country: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    customersService.getAll().then(({ data, error }) => {
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setCustomers(data || []);
      setLoading(false);
    });
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const searchTerm = search.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm) ||
      customer.phone?.toLowerCase().includes(searchTerm) ||
      customer.address?.toLowerCase().includes(searchTerm)
    );
  });

  // Pagination logic
  const paginatedCustomers = filteredCustomers.slice(
    currentPage * rowsPerPage,
    currentPage * rowsPerPage + rowsPerPage
  );
  const totalRows = filteredCustomers.length;
  const startRow = totalRows === 0 ? 0 : currentPage * rowsPerPage + 1;
  const endRow = Math.min((currentPage + 1) * rowsPerPage, totalRows);

  const handleEdit = (customer: any) => {
    setEditForm({
      id: customer.id,
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      country: customer.country || '',
    });
    setEditError(null);
    setEditSuccess(false);
    setShowEditModal(true);
  };

  const handleView = (customer: any) => {
    setViewCustomer(customer);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    setLoadingAction(true);
    const { error } = await customersService.remove(customerToDelete.id);
    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setToast({ message: 'Customer deleted', type: 'success' });
      // Refresh the customers list
      customersService.getAll().then(({ data, error }) => {
        if (!error) setCustomers(data || []);
      });
    }
    setShowDeleteConfirm(false);
    setCustomerToDelete(null);
    setLoadingAction(false);
  };

  const handleOpenCreate = () => {
    setCreateForm({ name: '', email: '', phone: '', address: '', city: '', country: '' });
    setCreateError(null);
    setCreateSuccess(false);
    setShowCreateModal(true);
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(false);
    const { error } = await customersService.create(createForm);
    setCreateLoading(false);
    if (error) {
      setCreateError(error.message);
    } else {
      setCreateSuccess(true);
      setShowCreateModal(false);
      // Refresh the customers list
      customersService.getAll().then(({ data, error }) => {
        if (!error) setCustomers(data || []);
      });
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(false);
    const { error } = await customersService.update(editForm.id, {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      address: editForm.address,
      city: editForm.city,
      country: editForm.country,
    });
    setEditLoading(false);
    if (error) {
      setEditError(error.message);
    } else {
      setEditSuccess(true);
      setShowEditModal(false);
      // Refresh the customers list
      customersService.getAll().then(({ data, error }) => {
        if (!error) setCustomers(data || []);
      });
    }
  };

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <AdminLayout
      title="Customers"
      breadcrumb={<span>People &gt; <span className="text-gray-900">Customers</span></span>}
    >
      <div className="py-6 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search customers..."
              className="border rounded px-3 py-2 w-full max-w-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" onClick={handleOpenCreate} type="button">Create</button>
          </div>
        </div>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-semibold"><input type="checkbox" /></th>
                  <th className="p-3 text-left font-semibold">Name</th>
                  <th className="p-3 text-left font-semibold">Email</th>
                  <th className="p-3 text-left font-semibold">Phone</th>
                  <th className="p-3 text-left font-semibold">Address</th>
                  <th className="p-3 text-center font-semibold" style={{ width: '110px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="p-3"><input type="checkbox" /></td>
                    <td className="p-3 font-medium">{customer.name}</td>
                    <td className="p-3">{customer.email}</td>
                    <td className="p-3">{customer.phone}</td>
                    <td className="p-3">{customer.address}</td>
                    <td className="p-3" style={{ minWidth: '110px', height: '100%' }}>
                      <div className="flex gap-2 items-center justify-center h-full">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleView(customer)}
                          title="View"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-800"
                          onClick={() => handleEdit(customer)}
                          title="Edit"
                          disabled={loadingAction}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => { setCustomerToDelete(customer); setShowDeleteConfirm(true); }}
                          title="Delete"
                          disabled={loadingAction}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            Rows per page:
            <select
              className="border rounded px-2 py-1 text-sm"
              value={rowsPerPage}
              onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(0); }}
            >
              {ROWS_PER_PAGE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span>{startRow} - {endRow} of {totalRows}</span>
            <button
              className="px-2 py-1 border rounded"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              prev
            </button>
            <button
              className="px-2 py-1 border rounded"
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalRows / rowsPerPage) - 1, p + 1))}
              disabled={endRow === totalRows}
            >
              next
            </button>
          </div>
        </div>
        {/* View Modal */}
        {viewCustomer && (
          <Modal isOpen={!!viewCustomer} onClose={() => setViewCustomer(null)} title="Customer Details">
            <div className="space-y-2">
              <div><span className="font-medium text-gray-500">Name:</span> <span className="font-semibold text-gray-900">{viewCustomer.name}</span></div>
              <div><span className="font-medium text-gray-500">Email:</span> <span className="font-semibold text-gray-900">{viewCustomer.email}</span></div>
              <div><span className="font-medium text-gray-500">Phone:</span> <span className="font-semibold text-gray-900">{viewCustomer.phone}</span></div>
              <div><span className="font-medium text-gray-500">Address:</span> <span className="font-semibold text-gray-900">{viewCustomer.address}</span></div>
              <div><span className="font-medium text-gray-500">City:</span> <span className="font-semibold text-gray-900">{viewCustomer.city}</span></div>
              <div><span className="font-medium text-gray-500">Country:</span> <span className="font-semibold text-gray-900">{viewCustomer.country}</span></div>
              <div><span className="font-medium text-gray-500">Created At:</span> <span className="font-semibold text-gray-900">{viewCustomer.created_at}</span></div>
            </div>
            <button className="mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200" onClick={() => setViewCustomer(null)}>Close</button>
          </Modal>
        )}
        {/* Delete Confirmation Modal */}
        <Modal isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setCustomerToDelete(null); }} title="Delete Customer">
          <p>Are you sure you want to delete this customer?</p>
          <p className="font-semibold mt-2">{customerToDelete?.name}</p>
          <div className="flex justify-end gap-2 mt-4">
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200" onClick={() => { setShowDeleteConfirm(false); setCustomerToDelete(null); }} disabled={loadingAction}>Cancel</button>
            <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={handleDelete} disabled={loadingAction}>{loadingAction ? 'Deleting...' : 'Delete'}</button>
          </div>
        </Modal>
        {/* Create Customer Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Customer">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input name="name" value={createForm.name} onChange={handleCreateChange} className="border rounded px-3 py-2 w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input name="email" type="email" value={createForm.email} onChange={handleCreateChange} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input name="phone" value={createForm.phone} onChange={handleCreateChange} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input name="address" value={createForm.address} onChange={handleCreateChange} className="border rounded px-3 py-2 w-full" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">City</label>
                <input name="city" value={createForm.city} onChange={handleCreateChange} className="border rounded px-3 py-2 w-full" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Country</label>
                <input name="country" value={createForm.country} onChange={handleCreateChange} className="border rounded px-3 py-2 w-full" />
              </div>
            </div>
            {createError && <div className="text-red-600 text-sm">{createError}</div>}
            <div className="flex gap-2 mt-4">
              <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" disabled={createLoading}>{createLoading ? 'Saving...' : 'Save'}</button>
              <button type="button" className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200" onClick={() => setShowCreateModal(false)} disabled={createLoading}>Cancel</button>
            </div>
          </form>
        </Modal>
        {/* Edit Customer Modal */}
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Customer">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input name="name" value={editForm.name} onChange={handleEditChange} className="border rounded px-3 py-2 w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input name="email" type="email" value={editForm.email} onChange={handleEditChange} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input name="phone" value={editForm.phone} onChange={handleEditChange} className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input name="address" value={editForm.address} onChange={handleEditChange} className="border rounded px-3 py-2 w-full" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">City</label>
                <input name="city" value={editForm.city} onChange={handleEditChange} className="border rounded px-3 py-2 w-full" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Country</label>
                <input name="country" value={editForm.country} onChange={handleEditChange} className="border rounded px-3 py-2 w-full" />
              </div>
            </div>
            {editError && <div className="text-red-600 text-sm">{editError}</div>}
            <div className="flex gap-2 mt-4">
              <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
              <button type="button" className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200" onClick={() => setShowEditModal(false)} disabled={editLoading}>Cancel</button>
            </div>
          </form>
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

export default Customers; 