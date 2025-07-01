import AdminLayout from '../layouts/AdminLayout';
import { useEffect, useState } from 'react';
import { customersService } from '../services/customersService';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import Modal from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

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
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
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
    // Fetch audit logs for this customer
    setLoadingAudit(true);
    customersService.getAuditLogs(customer.id).then(async ({ data, error }) => {
      if (error) setAuditError(error.message);
      else {
        setAuditLogs(data || []);
        const userIds = Array.from(new Set((data || []).map((log: any) => log.user_id)));
        if (userIds.length) {
          const users = await customersService.getUsersByIds(userIds);
          const map: Record<string, string> = {};
          users.forEach((u: any) => { map[u.user_id] = u.name || u.email || u.user_id; });
          setUserMap(map);
        }
      }
      setLoadingAudit(false);
    });
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

  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredCustomers.map(({ id, name, email, phone, address, city, country, created_at }) => ({ id, name, email, phone, address, city, country, created_at })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredCustomers.map(({ id, name, email, phone, address, city, country, created_at }) => ({ id, name, email, phone, address, city, country, created_at })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, 'customers.xlsx');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["ID", "Name", "Email", "Phone", "Address", "City", "Country", "Created At"]],
      body: filteredCustomers.map(({ id, name, email, phone, address, city, country, created_at }) => [id, name, email, phone, address, city, country, created_at]),
    });
    doc.save('customers.pdf');
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
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={handleExportCSV} type="button">Export CSV</button>
            <button className="border px-4 py-2 rounded text-green-600 border-green-400 hover:bg-green-50" onClick={handleExportPDF} type="button">PDF</button>
            <button className="border px-4 py-2 rounded text-red-600 border-red-400 hover:bg-red-50" onClick={handleExportExcel} type="button">EXCEL</button>
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
        {showCreateModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
              <h2 className="text-2xl font-bold mb-6">Create Customer</h2>
              <form onSubmit={handleCreateSubmit} className="space-y-5">
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Name</label>
                  <input name="name" value={createForm.name} onChange={handleCreateChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" required />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Email</label>
                  <input name="email" value={createForm.email} onChange={handleCreateChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" type="email" />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Phone</label>
                  <input name="phone" value={createForm.phone} onChange={handleCreateChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Address</label>
                  <input name="address" value={createForm.address} onChange={handleCreateChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">City</label>
                  <input name="city" value={createForm.city} onChange={handleCreateChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Country</label>
                  <input name="country" value={createForm.country} onChange={handleCreateChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <button type="button" className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold" onClick={() => setShowCreateModal(false)} disabled={createLoading}>Cancel</button>
                  <button type="submit" className="bg-black text-white font-semibold rounded-lg px-4 py-2" disabled={createLoading}>{createLoading ? 'Saving...' : 'Save Customer'}</button>
                </div>
                {createError && <div className="text-red-600 text-sm mt-2">{createError}</div>}
              </form>
            </div>
          </div>
        )}
        {/* Edit Customer Modal */}
        {showEditModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
              <h2 className="text-2xl font-bold mb-6">Edit Customer</h2>
              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Name</label>
                  <input name="name" value={editForm.name} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" required />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Email</label>
                  <input name="email" type="email" value={editForm.email} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Phone</label>
                  <input name="phone" value={editForm.phone} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Address</label>
                  <input name="address" value={editForm.address} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">City</label>
                  <input name="city" value={editForm.city} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Country</label>
                  <input name="country" value={editForm.country} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black" />
                </div>
                {editError && <div className="text-red-600 text-sm mt-2">{editError}</div>}
                <div className="flex gap-2 justify-end pt-4">
                  <button type="button" className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold" onClick={() => setShowEditModal(false)} disabled={editLoading}>Cancel</button>
                  <button type="submit" className="bg-black text-white font-semibold rounded-lg px-4 py-2" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
              {/* Audit log display */}
              <div className="mt-8">
                <h3 className="font-semibold mb-1">Change History</h3>
                {loadingAudit ? (
                  <div className="text-gray-500">Loading history...</div>
                ) : auditError ? (
                  <div className="text-red-500">{auditError}</div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-gray-400">No changes yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-left">When</th>
                          <th className="p-2 text-left">Who</th>
                          <th className="p-2 text-left">Changes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log, idx) => (
                          <tr key={log.id || idx} className="border-t">
                            <td className="p-2 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="p-2 whitespace-nowrap">{userMap[log.user_id] || log.user_id}</td>
                            <td className="p-2">
                              <ul className="list-disc ml-4">
                                {Object.entries(JSON.parse(log.changes)).map(([field, change]: any) => (
                                  <li key={field}><b>{field}</b>: {String(change.from)} → {String(change.to)}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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