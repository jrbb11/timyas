import AdminLayout from '../../layouts/AdminLayout';
import { FaEye, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { productsService } from '../../services/productsService';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/Modal';
import Papa from 'papaparse';
import { PermissionButton } from '../../components/PermissionComponents';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const AllProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewProduct, setViewProduct] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [selected, setSelected] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      const [{ data: products, error }, { data: stockData }] = await Promise.all([
        productsService.getAll(),
        productsService.getStockView(),
      ]);
      if (error) {
        setError(error.message);
      } else {
        // Merge stock into products
        const stockMap = Object.fromEntries((stockData || []).map(s => [s.id, s.stock]));
        setProducts(
          (products || []).map(p => ({
            ...p,
            quantity: stockMap[p.id] ?? 0,
          }))
        );
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedProducts = [...products].sort((a, b) => {
    const { key, direction } = sortConfig;
    let aValue = a[key];
    let bValue = b[key];
    if (["name", "code", "brand", "category", "type", "product_unit"].includes(key)) {
      aValue = (aValue?.name || aValue || '').toString().toLowerCase();
      bValue = (bValue?.name || bValue || '').toString().toLowerCase();
    }
    if (["product_cost", "product_price", "quantity"].includes(key)) {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredProducts = sortedProducts.filter((product) => {
    const searchTerm = search.toLowerCase();
    return (
      product.name?.toLowerCase().includes(searchTerm) ||
      product.code?.toLowerCase().includes(searchTerm) ||
      product.brand?.name?.toLowerCase().includes(searchTerm) ||
      product.category?.name?.toLowerCase().includes(searchTerm)
    );
  });

  // Pagination logic
  const paginatedProducts = filteredProducts.slice(
    currentPage * rowsPerPage,
    currentPage * rowsPerPage + rowsPerPage
  );
  const totalRows = filteredProducts.length;
  const startRow = totalRows === 0 ? 0 : currentPage * rowsPerPage + 1;
  const endRow = Math.min((currentPage + 1) * rowsPerPage, totalRows);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["ID", "Name", "Code", "Brand", "Category", "Price", "Cost", "Stock Alert", "Created At"]],
      body: filteredProducts.map(({ id, name, code, brand, category, product_price, product_cost, stock_alert, created_at }) => [id, name, code, brand?.name || '', category?.name || '', product_price, product_cost, stock_alert, created_at]),
    });
    doc.save('products.pdf');
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredProducts.map(({ id, name, code, brand, category, product_price, product_cost, stock_alert, created_at }) => ({ id, name, code, brand: brand?.name || '', category: category?.name || '', product_price, product_cost, stock_alert, created_at })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'products.xlsx');
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredProducts.map(({ id, name, code, brand_name, category_name, product_price, product_cost, stock_alert, created_at }) => ({ id, name, code, brand_name, category_name, product_price, product_cost, stock_alert, created_at })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      // Optionally map/validate fields here
      const { error } = await productsService.create(rows);
      if (error) setImportMessage('Import failed: ' + error.message);
      else setImportMessage('Import successful!');
      // Refresh products
      const { data: newData } = await productsService.getAll();
      setProducts(newData || []);
    } catch (err: any) {
      setImportMessage('Import failed: ' + err.message);
    }
    setImporting(false);
  };

  const handleEdit = (product: any) => {
    navigate(`/products/edit/${product.id}`);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setLoadingAction(true);
    const { error } = await productsService.remove(productToDelete.id);
    if (error) {
      setToast({ message: 'Delete failed: ' + error.message, type: 'error' });
    } else {
      setToast({ message: 'Product deleted successfully!', type: 'success' });
    }
    // Refresh products
    const [{ data: products }, { data: stockData }] = await Promise.all([
      productsService.getAll(),
      productsService.getStockView(),
    ]);
    const stockMap = Object.fromEntries((stockData || []).map(s => [s.id, s.stock]));
    setProducts(
      (products || []).map(p => ({
        ...p,
        quantity: stockMap[p.id] ?? 0,
      }))
    );
    setShowDeleteConfirm(false);
    setProductToDelete(null);
    setLoadingAction(false);
  };

  // Close modal on Escape key
  useEffect(() => {
    if (!viewProduct) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewProduct(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewProduct]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(paginatedProducts.map(p => p.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectRow = (id: any) => {
    setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const handleExportSelectedProducts = () => {
    const selectedProducts = products.filter(p => selected.includes(p.id));
    const csv = Papa.unparse(selectedProducts.map(({ id, name, code, brand, category, product_price, product_cost, stock_alert, created_at }) => ({ id, name, code, brand: brand?.name || '', category: category?.name || '', product_price, product_cost, stock_alert, created_at })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'selected_products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout
      title="All Products"
      breadcrumb={<span>Products &gt; <span className="text-gray-900">All Products</span></span>}
    >
      <div className="py-6 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex-1 flex gap-2 items-center">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search for products"
                className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg w-full text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ boxShadow: 'none' }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
            <button className="border border-blue-400 text-blue-600 px-4 py-2 rounded hover:bg-blue-50" onClick={handleImportClick} type="button">Import products</button>
            <button className="border border-gray-300 text-gray-700 bg-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-100 transition" onClick={handleExportCSV} type="button">Export Products</button>
            <PermissionButton
              resource="products"
              action="create"
              className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-gray-900 transition ml-auto"
              style={{minWidth: 120}}
              onClick={() => navigate('/products/create')}
            >
              + Create
            </PermissionButton>
            <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" ref={fileInputRef} onChange={handleImportFile} className="hidden" />
            {importing && <span className="ml-2 text-blue-500">Importing...</span>}
            {importMessage && <span className="ml-2 text-sm text-green-600">{importMessage}</span>}
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
                  <th className="p-3 text-left font-semibold">
                    <input type="checkbox" checked={selected.length === paginatedProducts.length && paginatedProducts.length > 0} onChange={handleSelectAll} />
                  </th>
                  <th className="p-3 text-left font-semibold">Image</th>
                  <th className="p-3 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('type')}>Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th className="p-3 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('name')}>Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th className="p-3 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('code')}>Code {sortConfig.key === 'code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th className="p-3 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('brand')}>Brand {sortConfig.key === 'brand' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th className="p-3 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('category')}>Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th className="p-3 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('product_cost')}>Cost {sortConfig.key === 'product_cost' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th className="p-3 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('product_price')}>Price {sortConfig.key === 'product_price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th className="p-3 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('product_unit')}>Unit {sortConfig.key === 'product_unit' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th className="p-3 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('quantity')}>Quantity {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th className="p-3 text-center font-semibold" style={{ width: '110px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className={`border-b hover:bg-gray-50 ${selected.includes(product.id) ? 'bg-blue-50' : ''}`}>
                    <td className="p-3">
                      <input type="checkbox" checked={selected.includes(product.id)} onChange={() => handleSelectRow(product.id)} />
                    </td>
                    <td className="p-3">
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                        {/* Placeholder for image */}
                        <span className="text-gray-400">📷</span>
                      </div>
                    </td>
                    <td className="p-3">{product.type}</td>
                    <td className="p-3">{product.name}</td>
                    <td className="p-3">{product.code}</td>
                    <td className="p-3">{product.brand?.name || ''}</td>
                    <td className="p-3">{product.category?.name || ''}</td>
                    <td className="p-3">{Number(product.product_cost).toFixed(2)}</td>
                    <td className="p-3">{Number(product.product_price).toFixed(2)}</td>
                    <td className="p-3">{product.product_unit?.name}</td>
                    <td className="p-3">{product.quantity} {product.product_unit?.short_name}</td>
                    <td className="p-3" style={{ minWidth: '110px', height: '100%' }}>
                      <div className="flex gap-2 items-center justify-center h-full">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => setViewProduct(product)}
                          title="View"
                        >
                          <FaEye />
                        </button>
                        <PermissionButton
                          resource="products"
                          action="update"
                          className="text-green-600 hover:text-green-800"
                          onClick={() => handleEdit(product)}
                          disabled={loadingAction}
                        >
                          <FaEdit />
                        </PermissionButton>
                        <PermissionButton
                          resource="products"
                          action="delete"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => { setProductToDelete(product); setShowDeleteConfirm(true); }}
                          disabled={loadingAction}
                        >
                          <FaTrash />
                        </PermissionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <div>
            Rows per page:
            <select className="ml-2 border rounded px-2 py-1" value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(0); }}>
              {ROWS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            {startRow} - {endRow} of {totalRows}
            <button className="ml-4 px-2 py-1" disabled={currentPage === 0} onClick={() => setCurrentPage(p => Math.max(0, p - 1))}>prev</button>
            <button className="ml-2 px-2 py-1" disabled={endRow >= totalRows} onClick={() => setCurrentPage(p => p + 1)}>next</button>
          </div>
        </div>
      </div>
      {/* Product View Modal */}
      {viewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/60"
          onClick={e => {
            if (e.target === e.currentTarget) setViewProduct(null);
          }}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-0 relative flex flex-col md:flex-row overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl z-10" onClick={() => setViewProduct(null)}>&times;</button>
            {/* Left: Image/QR/summary */}
            <div className="bg-gray-50 flex flex-col items-center justify-center p-8 md:w-1/2 w-full border-b md:border-b-0 md:border-r border-gray-200">
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                {/* Product image or placeholder */}
                <span className="text-5xl text-gray-400">📦</span>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{viewProduct.name}</div>
                <div className="text-sm text-gray-500">{viewProduct.code}</div>
              </div>
            </div>
            {/* Right: Details */}
            <div className="flex-1 p-8 flex flex-col gap-4">
              <h2 className="text-xl font-bold mb-2">Product Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                <div><span className="font-medium text-gray-500">Type:</span> <span className="font-semibold text-gray-900">{viewProduct.type}</span></div>
                <div><span className="font-medium text-gray-500">Brand:</span> <span className="font-semibold text-gray-900">{viewProduct.brand?.name || ''}</span></div>
                <div><span className="font-medium text-gray-500">Category:</span> <span className="font-semibold text-gray-900">{viewProduct.category?.name || ''}</span></div>
                <div><span className="font-medium text-gray-500">Cost:</span> <span className="font-semibold text-gray-900">{Number(viewProduct.product_cost).toFixed(2)}</span></div>
                <div><span className="font-medium text-gray-500">Price:</span> <span className="font-semibold text-gray-900">{Number(viewProduct.product_price).toFixed(2)}</span></div>
                <div><span className="font-medium text-gray-500">Unit:</span> <span className="font-semibold text-gray-900">{viewProduct.product_unit?.name}{viewProduct.product_unit?.short_name ? ` (${viewProduct.product_unit.short_name})` : ''}</span></div>
                <div><span className="font-medium text-gray-500">Quantity:</span> <span className="font-semibold text-gray-900">{viewProduct.quantity || 0}</span></div>
              </div>
              <div>
                <span className="font-medium text-gray-500">Description:</span>
                <div className="text-gray-900 mt-1 whitespace-pre-line">{viewProduct.description}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setProductToDelete(null); }}
        title="Delete Product"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
              onClick={() => { setShowDeleteConfirm(false); setProductToDelete(null); }}
              disabled={loadingAction}
            >
              Cancel
            </button>
            <button
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              onClick={handleDelete}
              disabled={loadingAction}
            >
              {loadingAction ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <p>Are you sure you want to delete this product?</p>
        <p className="font-semibold mt-2">{productToDelete?.name}</p>
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
          <button className="text-gray-700 hover:text-gray-900 font-semibold" onClick={handleExportSelectedProducts}>Export Products</button>
        </div>
      )}
    </AdminLayout>
  );
};

export default AllProducts; 