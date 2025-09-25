import AdminLayout from '../../layouts/AdminLayout';
import { useEffect, useState, useMemo } from 'react';
import { customersService } from '../../services/customersService';
import { FaEye, FaEdit, FaTrash, FaSearch, FaUserCircle } from 'react-icons/fa';
import Modal from '../../components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { supabase } from '../../utils/supabaseClient';

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
  const [selected, setSelected] = useState<string[]>([]);
  const [branchDetails, setBranchDetails] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [salesStats, setSalesStats] = useState({ total: 0, paid: 0, unpaid: 0 });
  const [customerSalesTotals, setCustomerSalesTotals] = useState<Record<string, number>>({});
  const [customerPaidTotals, setCustomerPaidTotals] = useState<Record<string, number>>({});
  const [customerDuesTotals, setCustomerDuesTotals] = useState<Record<string, number>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'total', direction: 'desc' });
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

  useEffect(() => {
    // Fetch all sales_view for stats and per-customer totals
    supabase
      .from('sales_view')
      .select('person_id, total_amount, payment_status, due, paid')
      .then(({ data: sales }) => {
        if (!sales) return;
        let total = 0, paid = 0, unpaid = 0;
        const totals: Record<string, number> = {};
        const dues: Record<string, number> = {};
        const paids: Record<string, number> = {};
        sales.forEach((s: any) => {
          if (s.person_id) {
            const totalAmount = Number(s.total_amount || 0);
            const shipping = Number(s.shipping || 0);
            totals[s.person_id] = (totals[s.person_id] || 0) + (totalAmount - shipping);
            paids[s.person_id] = (paids[s.person_id] || 0) + Number(s.paid || 0);
            if (s.payment_status === 'pending' || s.payment_status === 'partial') {
              dues[s.person_id] = (dues[s.person_id] || 0) + Number(s.due || 0);
            }
          }
          const totalAmount = Number(s.total_amount || 0);
          const shipping = Number(s.shipping || 0);
          total += (totalAmount - shipping);
          if (s.payment_status === 'paid') paid += (totalAmount - shipping);
          else if (s.payment_status === 'pending' || s.payment_status === 'partial') unpaid += (totalAmount - shipping);
        });
        setSalesStats({ total, paid, unpaid });
        setCustomerSalesTotals(totals);
        setCustomerPaidTotals(paids);
        setCustomerDuesTotals(dues);
      });
  }, [customers]);

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

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const sortedCustomers = [...paginatedCustomers].sort((a, b) => {
    let aValue = 0, bValue = 0;
    if (sortConfig.key === 'total') {
      aValue = customerSalesTotals[a.id] || 0;
      bValue = customerSalesTotals[b.id] || 0;
    } else if (sortConfig.key === 'paid') {
      aValue = customerPaidTotals[a.id] || 0;
      bValue = customerPaidTotals[b.id] || 0;
    } else if (sortConfig.key === 'dues') {
      aValue = customerDuesTotals[a.id] || 0;
      bValue = customerDuesTotals[b.id] || 0;
    }
    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
  });

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

  const handleExportSelected = () => {
    // Implementation of handleExportSelected function
  };

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (!viewCustomer) return;
    setLoadingBranches(true);
    // 1. Fetch all people_branches_view for this customer
    supabase
      .from('people_branches_view')
      .select('*')
      .eq('person_id', viewCustomer.id)
      .then(async ({ data: branches }) => {
        if (!branches) {
          setBranchDetails([]);
          setLoadingBranches(false);
          return;
        }
        // 2. For each branch, fetch sales_view and calculate totals
        const details = await Promise.all(
          branches.map(async (pb: any) => {
            const { data: sales } = await supabase
              .from('sales_view')
              .select('total_amount, due')
              .eq('people_branches_id', pb.id);
            const totalSales = (sales || []).reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
            const totalDue = (sales || []).reduce((sum, s) => sum + (Number(s.due) > 0 ? Number(s.due) : 0), 0);
            return {
              branchName: pb.branch_name,
              totalSales,
              totalDue,
            };
          })
        );
        setBranchDetails(details);
        setLoadingBranches(false);
      });
  }, [viewCustomer]);

  return (
    <AdminLayout
      title="Franchisee"
      breadcrumb={<span>People &gt; <span className="text-gray-900">Franchisee</span></span>}
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1 flex gap-2 items-center">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search customers..."
                className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg w-full text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <button className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-gray-900 transition ml-auto" style={{minWidth: 120}} onClick={() => navigate('/franchisee/create')} type="button">+ Add Franchisee</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-blue-50 p-5 flex flex-col gap-2 shadow">
            <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
              <span className="bg-blue-100 rounded-full p-2"><svg width="18" height="18" fill="currentColor"><circle cx="9" cy="9" r="8" /></svg></span>
              Total Sales
            </div>
            <div className="text-2xl font-bold text-blue-800">₱{salesStats.total.toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-green-50 p-5 flex flex-col gap-2 shadow">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
              <span className="bg-green-100 rounded-full p-2"><svg width="18" height="18" fill="currentColor"><circle cx="9" cy="9" r="8" /></svg></span>
              Paid Sales
            </div>
            <div className="text-2xl font-bold text-green-800">₱{salesStats.paid.toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-red-50 p-5 flex flex-col gap-2 shadow">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
              <span className="bg-red-100 rounded-full p-2"><svg width="18" height="18" fill="currentColor"><circle cx="9" cy="9" r="8" /></svg></span>
              Unpaid Sales
            </div>
            <div className="text-2xl font-bold text-red-800">₱{salesStats.unpaid.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-0 overflow-x-auto">
          <table className="min-w-full rounded-lg overflow-hidden shadow bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left font-semibold">Avatar</th>
                <th className="p-4 text-left font-semibold">Name</th>
                <th className="p-4 text-left font-semibold">Email</th>
                <th className="p-4 text-left font-semibold">Phone</th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold cursor-pointer" onClick={() => handleSort('total')}>
                  Total Sales {sortConfig.key === 'total' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="p-4 text-left font-semibold cursor-pointer" onClick={() => handleSort('paid')}>
                  Paid {sortConfig.key === 'paid' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="p-4 text-left font-semibold cursor-pointer" onClick={() => handleSort('dues')}>
                  Dues {sortConfig.key === 'dues' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="p-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCustomers.map((customer) => (
                <tr key={customer.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600">
                      {customer.name ? customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) : <FaUserCircle size={32} />}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{customer.name}</td>
                  <td className="p-4">{customer.email}</td>
                  <td className="p-4">{customer.phone}</td>
                  <td className="p-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
                  </td>
                  <td className="p-4">₱{customerSalesTotals[customer.id]?.toLocaleString() || 0}</td>
                  <td className="p-4 text-green-700 font-semibold">₱{customerPaidTotals[customer.id]?.toLocaleString() || 0}</td>
                  <td className="p-4 text-red-600 font-semibold">₱{customerDuesTotals[customer.id]?.toLocaleString() || 0}</td>
                  <td className="p-4 flex gap-2">
                    <button
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded font-semibold"
                      onClick={() => setViewCustomer(customer)}
                    >View</button>
                    <button
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded font-semibold"
                      onClick={() => alert('Send follow up for dues!')}
                    >Send Follow Up for Dues</button>
                  </td>
                </tr>
              ))}
              {sortedCustomers.length === 0 && (
                <tr><td colSpan={7} className="text-center p-6 text-gray-400">No customers found.</td></tr>
              )}
            </tbody>
          </table>
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
          <Modal isOpen={!!viewCustomer} onClose={() => setViewCustomer(null)} title={null}>
            <div className="flex flex-col gap-6">
              {/* Franchisee summary */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                  {viewCustomer.name ? viewCustomer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) : <FaUserCircle size={40} />}
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-gray-900">{viewCustomer.name}</div>
                  <div className="text-gray-600 text-sm">{viewCustomer.email || <span className="italic text-gray-400">No email</span>}</div>
                  <div className="text-gray-600 text-sm">{viewCustomer.phone || <span className="italic text-gray-400">No phone</span>}</div>
                  <div className="text-gray-600 text-sm">{[viewCustomer.address, viewCustomer.city, viewCustomer.country].filter(Boolean).join(', ') || <span className="italic text-gray-400">No address</span>}</div>
                </div>
              </div>
              {/* Branches grid */}
              {loadingBranches ? (
                <div className="py-8 text-center text-gray-400">Loading branch details...</div>
              ) : branchDetails.length === 0 ? (
                <div className="py-8 text-center text-gray-400">No branches found for this customer.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {branchDetails.map((b, i) => (
                    <div key={i} className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 border pb-4">
                      <div className="flex flex-col items-center gap-y-1 mb-2 min-h-[3.5rem]">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">Branch</span>
                        <span
                          className="font-semibold text-lg text-blue-900 text-center line-clamp-2"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '2.5rem',
                            maxHeight: '2.5rem',
                            lineHeight: '1.25rem',
                            height: '2.5rem',
                            width: '100%',
                          }}
                        >
                          {b.branchName}
                        </span>
                      </div>
                      <div className="text-gray-600 text-sm">Code: <span className="font-mono">{b.code || '-'}</span></div>
                      <div className="text-gray-600 text-sm">Address: {b.address || <span className="italic text-gray-400">N/A</span>}</div>
                      <div className="text-gray-600 text-sm">City: {b.city || <span className="italic text-gray-400">N/A</span>}</div>
                      <div className="text-gray-600 text-sm">Country: {b.country || <span className="italic text-gray-400">N/A</span>}</div>
                      <div className="flex flex-col gap-2 mt-6">
                        <div className="flex flex-col items-center bg-blue-100 rounded-lg px-4 py-2">
                          <span className="text-xs font-semibold text-blue-700">Total Sales</span>
                          <span className="text-lg font-bold text-blue-800">₱{b.totalSales.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-center bg-red-100 rounded-lg px-4 py-2">
                          <span className="text-xs font-semibold text-red-700">Total Due</span>
                          <span className="text-lg font-bold text-red-800">₱{b.totalDue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end mt-6">
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold" onClick={() => setViewCustomer(null)}>Close</button>
              </div>
            </div>
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
        {selected.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex gap-4 items-center border z-50">
            <span className="font-semibold text-gray-700">{selected.length} selected</span>
            <button className="text-gray-700 hover:text-gray-900 font-semibold" onClick={handleExportSelected}>Export Customers</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Customers; 