import AdminLayout from '../../layouts/AdminLayout';
import { useEffect, useState } from 'react';
import { stockMovementService } from '../../services/stockMovementService';
import { productsService } from '../../services/productsService';
import { warehousesService } from '../../services/warehousesService';
import { FaSearch } from 'react-icons/fa';

const StockMovementHistory = () => {
  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [movementType, setMovementType] = useState('all'); // all, purchases, sales, adjustments
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      productsService.getAll(),
      warehousesService.getAll(),
    ]).then(([{ data: products }, { data: warehouses }]) => {
      setProducts(products || []);
      setWarehouses(warehouses || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    // Reset to first page whenever filters change
    setCurrentPage(0);
    loadMovements();
  }, [selectedProduct, selectedWarehouse, dateFrom, dateTo, movementType]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      let movementsData: any[] = [];

      // Ensure end date includes the whole day
      const dateToEnd = dateTo ? `${dateTo} 23:59:59` : undefined;

      if (movementType === 'all' || movementType === 'adjustments') {
        const { data: adjustments } = await stockMovementService.getMovementHistory(
          selectedProduct || undefined,
          selectedWarehouse || undefined,
          dateFrom || undefined,
          dateToEnd
        );
        movementsData.push(...(adjustments || []).map((item: any) => ({
          ...item,
          type: 'adjustment',
          movement_type: item.type === 'addition' ? 'Stock Addition' : 'Stock Subtraction',
          reference: item.adjustment_batch?.reference_code,
          date: item.adjusted_at,
          quantity: item.quantity,
          warehouse: item.adjustment_batch?.warehouse?.name,
        })));
      }

      if (movementType === 'all' || movementType === 'purchases') {
        const { data: purchases } = await stockMovementService.getPurchaseMovements(
          selectedProduct || undefined,
          selectedWarehouse || undefined,
          dateFrom || undefined,
          dateToEnd
        );
        movementsData.push(...(purchases || []).map((item: any) => ({
          ...item,
          type: 'purchase',
          movement_type: 'Purchase',
          reference: item.purchase?.reference,
          date: item.purchase?.date,
          quantity: item.qty,
          warehouse: item.purchase?.warehouse?.name,
        })));
      }

      if (movementType === 'all' || movementType === 'sales') {
        const { data: sales } = await stockMovementService.getSaleMovements(
          selectedProduct || undefined,
          selectedWarehouse || undefined,
          dateFrom || undefined,
          dateToEnd
        );
        movementsData.push(...(sales || []).map((item: any) => ({
          ...item,
          type: 'sale',
          movement_type: 'Sale',
          reference: item.sale?.reference,
          date: item.sale?.date,
          quantity: item.qty,
          warehouse: item.sale?.warehouse?.name,
        })));
      }

      // Sort by date (newest first)
      movementsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMovements(movementsData);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const filteredMovements = movements.filter((movement) => {
    const searchTerm = search.toLowerCase();
    return (
      movement.product?.name?.toLowerCase().includes(searchTerm) ||
      movement.product?.code?.toLowerCase().includes(searchTerm) ||
      movement.reference?.toLowerCase().includes(searchTerm) ||
      movement.warehouse?.toLowerCase().includes(searchTerm)
    );
  });

  // Pagination logic
  const paginatedMovements = filteredMovements.slice(
    currentPage * rowsPerPage,
    currentPage * rowsPerPage + rowsPerPage
  );
  const totalRows = filteredMovements.length;
  const startRow = totalRows === 0 ? 0 : currentPage * rowsPerPage + 1;
  const endRow = Math.min((currentPage + 1) * rowsPerPage, totalRows);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return '📦';
      case 'sale':
        return '💰';
      case 'adjustment':
        return '⚖️';
      default:
        return '📊';
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'text-green-600 bg-green-100';
      case 'sale':
        return 'text-red-600 bg-red-100';
      case 'adjustment':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && movements.length === 0) {
    return (
      <AdminLayout title="Stock Movement History">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Stock Movement History"
      breadcrumb={<span>Products &gt; <span className="text-gray-900">Stock Movement History</span></span>}
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
                placeholder="Search movements..."
                className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg w-full text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          {/* Add action buttons here if needed */}
        </div>
        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
              >
                <option value="">All Products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Warehouse</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedWarehouse}
                onChange={e => setSelectedWarehouse(e.target.value)}
              >
                <option value="">All Warehouses</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Movement Type</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={movementType}
                onChange={e => setMovementType(e.target.value)}
              >
                <option value="all">All Movements</option>
                <option value="purchases">Purchases Only</option>
                <option value="sales">Sales Only</option>
                <option value="adjustments">Adjustments Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 border rounded px-3 py-2"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  placeholder="From"
                />
                <input
                  type="date"
                  className="flex-1 border rounded px-3 py-2"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  placeholder="To"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search movements..."
              className="border rounded px-3 py-2 w-full max-w-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-500">
            Total Movements: {totalRows}
          </div>
        </div>

        {/* Movements Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left font-semibold">Type</th>
                <th className="p-3 text-left font-semibold">Product</th>
                <th className="p-3 text-left font-semibold">Reference</th>
                <th className="p-3 text-left font-semibold">Date</th>
                <th className="p-3 text-left font-semibold">Warehouse</th>
                <th className="p-3 text-left font-semibold">Quantity</th>
                <th className="p-3 text-left font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.length === 0 ? (
                <tr>
                  <td className="p-3 text-center text-gray-400" colSpan={7}>No movements found</td>
                </tr>
              ) : (
                paginatedMovements.map((movement, index) => (
                  <tr key={`${movement.type}-${movement.id}-${index}`} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getMovementIcon(movement.type)}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getMovementColor(movement.type)}`}>
                          {movement.movement_type}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-bold text-green-700">{movement.product?.code}</div>
                        <div className="text-sm text-gray-600">{movement.product?.name}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-purple-600">{movement.reference}</span>
                    </td>
                    <td className="p-3">
                      {new Date(movement.date).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {movement.warehouse || 'N/A'}
                    </td>
                    <td className="p-3">
                      <span className={`font-bold ${
                        movement.type === 'sale' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {movement.type === 'sale' ? '-' : '+'}{movement.quantity}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-gray-500">
                        {movement.type === 'adjustment' && (
                          <>
                            Before: {movement.before_stock} → After: {movement.after_stock}
                          </>
                        )}
                        {movement.type === 'purchase' && (
                          <>
                            Cost: ₱{movement.cost} | Total: ₱{movement.subtotal}
                          </>
                        )}
                        {movement.type === 'sale' && (
                          <>
                            Price: ₱{movement.price} | Total: ₱{(movement.price * movement.qty).toFixed(2)}
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <div>
            Rows per page:
            <select 
              className="ml-2 border rounded px-2 py-1"
              value={rowsPerPage}
              onChange={e => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(0);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div>
            {startRow} - {endRow} of {totalRows}
            <button 
              className="ml-4 px-2 py-1" 
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              prev
            </button>
            <button 
              className="ml-2 px-2 py-1" 
              disabled={endRow >= totalRows}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default StockMovementHistory; 