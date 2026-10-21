import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { suppliersService, type SupplierPayload } from '../../services/suppliersService';
import { 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaTruck, 
  FaPlus, 
  FaFileCsv, 
  FaFileExcel, 
  FaFilePdf, 
  FaBuilding, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaReceipt 
} from 'react-icons/fa';
import Modal from '../../components/ui/Modal';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  // Stats
  const [purchasesSummary, setPurchasesSummary] = useState<any[]>([]);
  const [supplierPurchasesMap, setSupplierPurchasesMap] = useState<Record<string, { count: number; totalAmount: number }>>({});

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<SupplierPayload>({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Philippines',
    note: '',
    is_active: true,
  });
  const [createLoading, setCreateLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({
    id: '',
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Philippines',
    note: '',
    is_active: true,
  });
  const [editLoading, setEditLoading] = useState(false);

  const [viewSupplier, setViewSupplier] = useState<any | null>(null);
  const [supplierPurchases, setSupplierPurchases] = useState<any[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load suppliers and purchases summary
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: supps, error: suppsErr }, { data: purchases, error: purchErr }] = await Promise.all([
        suppliersService.getAll(),
        suppliersService.getAllPurchasesSummary(),
      ]);

      if (suppsErr) throw suppsErr;
      setSuppliers(supps || []);

      if (purchases) {
        setPurchasesSummary(purchases);
        const map: Record<string, { count: number; totalAmount: number }> = {};
        purchases.forEach((p: any) => {
          if (p.supplier) {
            if (!map[p.supplier]) {
              map[p.supplier] = { count: 0, totalAmount: 0 };
            }
            map[p.supplier].count += 1;
            map[p.supplier].totalAmount += Number(p.total_amount || 0);
          }
        });
        setSupplierPurchasesMap(map);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load suppliers');
      toast.error('Failed to load suppliers: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return suppliers.filter((s) => {
      const matchesSearch =
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.company?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && s.is_active !== false) ||
        (statusFilter === 'inactive' && s.is_active === false);

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / rowsPerPage) || 1;
  const paginatedSuppliers = useMemo(() => {
    const start = currentPage * rowsPerPage;
    return filteredSuppliers.slice(start, start + rowsPerPage);
  }, [filteredSuppliers, currentPage, rowsPerPage]);

  // Overall statistics
  const totalSuppliersCount = suppliers.length;
  const totalPurchasesVolume = useMemo(() => {
    return purchasesSummary.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
  }, [purchasesSummary]);

  // Handle Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    setCreateLoading(true);
    try {
      const { data, error } = await suppliersService.create(createForm);
      if (error) throw error;
      toast.success(`Supplier "${createForm.name}" created successfully!`);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Philippines',
        note: '',
        is_active: true,
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create supplier');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Edit
  const handleEditClick = (supplier: any) => {
    setEditForm({
      id: supplier.id,
      name: supplier.name || '',
      company: supplier.company || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      country: supplier.country || 'Philippines',
      note: supplier.note || '',
      is_active: supplier.is_active !== false,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    setEditLoading(true);
    try {
      const { error } = await suppliersService.update(editForm.id, editForm);
      if (error) throw error;
      toast.success(`Supplier updated successfully!`);
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update supplier');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle View
  const handleViewClick = async (supplier: any) => {
    setViewSupplier(supplier);
    setLoadingPurchases(true);
    try {
      const { data, error } = await suppliersService.getPurchasesBySupplier(supplier.id);
      if (error) throw error;
      setSupplierPurchases(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load purchases history');
    } finally {
      setLoadingPurchases(false);
    }
  };

  // Handle Delete
  const handleDeleteClick = (supplier: any) => {
    setSupplierToDelete(supplier);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;
    setDeleteLoading(true);
    try {
      const { error } = await suppliersService.remove(supplierToDelete.id);
      if (error) {
        // If foreign key violation, offer to deactivate instead
        if (error.code === '23503' || error.message.includes('foreign key')) {
          const confirmDeactivate = window.confirm(
            `Cannot delete "${supplierToDelete.name}" because there are purchase records linked to this supplier.\n\nWould you like to deactivate this supplier instead?`
          );
          if (confirmDeactivate) {
            await suppliersService.update(supplierToDelete.id, { is_active: false });
            toast.success(`Supplier "${supplierToDelete.name}" has been deactivated.`);
            setShowDeleteModal(false);
            setSupplierToDelete(null);
            loadData();
            return;
          }
        }
        throw error;
      }
      toast.success(`Supplier "${supplierToDelete.name}" deleted.`);
      setShowDeleteModal(false);
      setSupplierToDelete(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete supplier');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const data = filteredSuppliers.map((s) => ({
      Name: s.name,
      Company: s.company || '',
      Email: s.email || '',
      Phone: s.phone || '',
      Address: s.address || '',
      City: s.city || '',
      Country: s.country || '',
      Status: s.is_active !== false ? 'Active' : 'Inactive',
      'Total Purchases': supplierPurchasesMap[s.id]?.count || 0,
      'Total Spend (PHP)': supplierPurchasesMap[s.id]?.totalAmount?.toFixed(2) || '0.00',
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Suppliers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const data = filteredSuppliers.map((s) => ({
      Name: s.name,
      Company: s.company || '',
      Email: s.email || '',
      Phone: s.phone || '',
      Address: s.address || '',
      City: s.city || '',
      Country: s.country || '',
      Status: s.is_active !== false ? 'Active' : 'Inactive',
      'Total Purchases': supplierPurchasesMap[s.id]?.count || 0,
      'Total Spend (PHP)': supplierPurchasesMap[s.id]?.totalAmount || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
    XLSX.writeFile(wb, `Suppliers_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Suppliers List - Timyas Lechon Manok', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    const headers = [['Name', 'Company', 'Phone', 'Email', 'City', 'Status', 'Total Spend']];
    const rows = filteredSuppliers.map((s) => [
      s.name,
      s.company || '-',
      s.phone || '-',
      s.email || '-',
      s.city || '-',
      s.is_active !== false ? 'Active' : 'Inactive',
      `₱${(supplierPurchasesMap[s.id]?.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [29, 78, 216] },
    });

    doc.save(`Suppliers_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <AdminLayout
      title="Suppliers"
      breadcrumb={
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Purchases</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Suppliers</span>
        </div>
      }
    >
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-500">Total Suppliers</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{totalSuppliersCount}</div>
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              Active vendors in database
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <FaTruck size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-500">Total Purchases Value</div>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              ₱{totalPurchasesVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              From {purchasesSummary.length} total purchase orders
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <FaReceipt size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-500">Filtered Results</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{filteredSuppliers.length}</div>
            <div className="text-xs text-gray-500 mt-1">
              Showing on current view
            </div>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <FaBuilding size={22} />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header / Actions */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 max-w-lg">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers by name, company, email, phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e: any) => {
                setStatusFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              title="Export CSV"
              className="p-2.5 text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 transition"
            >
              <FaFileCsv size={16} />
            </button>
            <button
              onClick={handleExportExcel}
              title="Export Excel"
              className="p-2.5 text-gray-600 hover:text-green-600 bg-gray-50 hover:bg-green-50 rounded-xl border border-gray-200 transition"
            >
              <FaFileExcel size={16} />
            </button>
            <button
              onClick={handleExportPDF}
              title="Export PDF"
              className="p-2.5 text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-xl border border-gray-200 transition"
            >
              <FaFilePdf size={16} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm shadow-sm transition"
            >
              <FaPlus size={13} />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
              <div>Loading suppliers...</div>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">{error}</div>
          ) : paginatedSuppliers.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <FaTruck size={40} className="mx-auto mb-3 opacity-40" />
              <div className="text-base font-medium text-gray-600">No suppliers found</div>
              <div className="text-sm mt-1">Try adjusting your search or add a new supplier.</div>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-6">Supplier / Company</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Purchases</th>
                  <th className="py-3.5 px-4">Total Spend</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedSuppliers.map((s) => {
                  const spend = supplierPurchasesMap[s.id]?.totalAmount || 0;
                  const purchaseCount = supplierPurchasesMap[s.id]?.count || 0;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900">{s.name}</div>
                        {s.company && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <FaBuilding size={11} className="text-gray-400" />
                            <span>{s.company}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {s.phone && (
                          <div className="text-xs text-gray-700 flex items-center gap-1.5">
                            <FaPhone size={10} className="text-gray-400" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                        {s.email && (
                          <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <FaEnvelope size={10} className="text-gray-400" />
                            <span>{s.email}</span>
                          </div>
                        )}
                        {!s.phone && !s.email && <span className="text-xs text-gray-400 italic">No contact info</span>}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs text-gray-800">
                          {s.city || s.address ? (
                            <span className="flex items-center gap-1">
                              <FaMapMarkerAlt size={10} className="text-gray-400" />
                              {s.city || s.address}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                          {purchaseCount} {purchaseCount === 1 ? 'order' : 'orders'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">
                          ₱{spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {s.is_active !== false ? (
                          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewClick(s)}
                            title="View details & purchases"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <FaEye size={15} />
                          </button>
                          <button
                            onClick={() => handleEditClick(s)}
                            title="Edit supplier"
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <FaEdit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(s)}
                            title="Delete supplier"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && filteredSuppliers.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700"
              >
                {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">
                Showing {currentPage * rowsPerPage + 1} to{' '}
                {Math.min((currentPage + 1) * rowsPerPage, filteredSuppliers.length)} of {filteredSuppliers.length} entries
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm font-medium text-gray-700">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE SUPPLIER MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Supplier"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Benben Dressed Chicken"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Benben Poultry & Meat Corp"
              value={createForm.company || ''}
              onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                placeholder="0917-000-0000"
                value={createForm.phone || ''}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="supplier@domain.com"
                value={createForm.email || ''}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City / Municipality
              </label>
              <input
                type="text"
                placeholder="e.g. Quezon City"
                value={createForm.city || ''}
                onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address / Street
              </label>
              <input
                type="text"
                placeholder="Street address or barangay"
                value={createForm.address || ''}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Additional notes about this supplier..."
              value={createForm.note || ''}
              onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="create_is_active"
              checked={createForm.is_active !== false}
              onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="create_is_active" className="text-sm text-gray-700 cursor-pointer">
              Active Supplier
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {createLoading ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT SUPPLIER MODAL */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Supplier"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name (Optional)
            </label>
            <input
              type="text"
              value={editForm.company || ''}
              onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City / Municipality
              </label>
              <input
                type="text"
                value={editForm.city || ''}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address / Street
              </label>
              <input
                type="text"
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={editForm.note || ''}
              onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="edit_is_active"
              checked={editForm.is_active !== false}
              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="edit_is_active" className="text-sm text-gray-700 cursor-pointer">
              Active Supplier
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {editLoading ? 'Saving...' : 'Update Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW SUPPLIER & PURCHASE HISTORY MODAL */}
      <Modal
        isOpen={!!viewSupplier}
        onClose={() => setViewSupplier(null)}
        title={viewSupplier ? `${viewSupplier.name}` : 'Supplier Details'}
      >
        {viewSupplier && (
          <div className="space-y-5">
            {/* Contact details grid */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
              {viewSupplier.company && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-24">Company:</span>
                  <span className="font-semibold text-gray-900">{viewSupplier.company}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-24">Phone:</span>
                <span className="text-gray-900">{viewSupplier.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-24">Email:</span>
                <span className="text-gray-900">{viewSupplier.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-24">Address:</span>
                <span className="text-gray-900">
                  {[viewSupplier.address, viewSupplier.city, viewSupplier.country].filter(Boolean).join(', ') || 'N/A'}
                </span>
              </div>
              {viewSupplier.note && (
                <div className="flex items-start gap-2 pt-1 border-t border-gray-200/60 mt-2">
                  <span className="text-gray-500 w-24">Note:</span>
                  <span className="text-gray-700 italic">{viewSupplier.note}</span>
                </div>
              )}
            </div>

            {/* Purchase orders history */}
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2 flex items-center justify-between">
                <span>Purchase Orders History</span>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                  {supplierPurchases.length} total
                </span>
              </div>

              {loadingPurchases ? (
                <div className="py-8 text-center text-gray-400 text-sm">Loading purchases...</div>
              ) : supplierPurchases.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-xs italic bg-gray-50 rounded-lg">
                  No purchase orders recorded for this supplier yet.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Reference</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {supplierPurchases.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-600">{p.date || '-'}</td>
                          <td className="py-2 px-3 font-medium text-gray-900">{p.reference}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-gray-100 text-gray-700">
                              {p.status || 'Received'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-gray-900">
                            ₱{Number(p.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewSupplier(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Supplier"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete supplier <strong className="text-gray-900">{supplierToDelete?.name}</strong>?
          </p>
          <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-200">
            Note: If this supplier already has linked purchase records, deletion might be restricted to protect order integrity. In that case, you can deactivate them instead.
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={handleDeleteConfirm}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
