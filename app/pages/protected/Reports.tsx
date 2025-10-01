import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { FaChartBar, FaCalendarAlt, FaFileCsv, FaBoxes, FaTags, FaTrademark, FaBalanceScale, FaUsers } from 'react-icons/fa';
import ReportSummaryCard from '../../components/ui/ReportSummaryCard';
import { salesService } from '../../services/salesService';
import { purchasesService } from '../../services/purchasesService';
import { supabase } from '../../utils/supabaseClient';
import { productsService } from '../../services/productsService';
import { categoriesService } from '../../services/categoriesService';
import { brandsService } from '../../services/brandsService';
import { unitsService } from '../../services/unitsService';
import { customersService } from '../../services/customersService';
import { PermissionGuard } from '../../components/PermissionComponents';

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
}

const Reports = () => {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      salesService.getView(),
      purchasesService.getAll(),
      supabase.from('expenses').select('*'),
      productsService.getAll(),
      categoriesService.getAll(),
      brandsService.getAll(),
      unitsService.getAll(),
      customersService.getAll(),
      supabase.from('sale_items').select('*, product:products(id, name, code), sale:sales(id, date)'),
      supabase.from('purchase_items').select('*, product:products(id, name, code), purchase:purchases(id, date)'),
    ])
      .then(([
        salesRes,
        purchasesRes,
        expensesRes,
        productsRes,
        categoriesRes,
        brandsRes,
        unitsRes,
        customersRes,
        saleItemsRes,
        purchaseItemsRes,
      ]) => {
        if (salesRes.error) throw salesRes.error;
        if (purchasesRes.error) throw purchasesRes.error;
        if (expensesRes.error) throw expensesRes.error;
        if (productsRes.error) throw productsRes.error;
        if (categoriesRes.error) throw categoriesRes.error;
        if (brandsRes.error) throw brandsRes.error;
        if (unitsRes.error) throw unitsRes.error;
        if (customersRes.error) throw customersRes.error;
        if (saleItemsRes.error) throw saleItemsRes.error;
        if (purchaseItemsRes.error) throw purchaseItemsRes.error;
        setSales(salesRes.data || []);
        setPurchases(purchasesRes.data || []);
        setExpenses(expensesRes.data || []);
        setProducts(productsRes.data || []);
        setCategories(categoriesRes.data || []);
        setBrands(brandsRes.data || []);
        setUnits(unitsRes.data || []);
        setCustomers(customersRes.data || []);
        setSaleItems(saleItemsRes.data || []);
        setPurchaseItems(purchaseItemsRes.data || []);
      })
      .catch((err) => setError(err.message || 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  // Filter by date range
  const filterByDate = (arr: any[], dateKey: string) => {
    if (!dateRange.from || !dateRange.to) return arr;
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    to.setHours(23, 59, 59, 999);
    return arr.filter((item) => {
      const d = new Date(item[dateKey]);
      return d >= from && d <= to;
    });
  };

  // Section: Products
  const recentProducts = useMemo(() => {
    return [...products].sort((a, b) => new Date(b.created_at || b.id).getTime() - new Date(a.created_at || a.id).getTime()).slice(0, 10);
  }, [products]);

  // Section: Sales
  const filteredSales = useMemo(() => filterByDate(sales, 'date'), [sales, dateRange]);
  const totalSales = filteredSales.reduce((sum, s) => {
    const totalAmount = Number(s.total_amount) || 0;
    const shipping = Number(s.shipping) || 0;
    return sum + (totalAmount - shipping);
  }, 0);
  const salesChartData = (() => {
    const map: Record<string, number> = {};
    filteredSales.forEach((item) => {
      const d = item.date?.slice(0, 10);
      if (!d) return;
      const totalAmount = Number(item.total_amount) || 0;
      const shipping = Number(item.shipping) || 0;
      map[d] = (map[d] || 0) + (totalAmount - shipping);
    });
    let days: string[] = [];
    if (dateRange.from && dateRange.to) {
      let d = new Date(dateRange.from);
      const to = new Date(dateRange.to);
      while (d <= to) {
        const key = d.toISOString().slice(0, 10);
        days.push(key);
        d.setDate(d.getDate() + 1);
      }
    } else {
      days = Object.keys(map).sort();
    }
    return days.map((day) => ({ date: day, value: map[day] || 0 }));
  })();
  const recentSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [filteredSales]);

  // Section: Purchases
  const filteredPurchases = useMemo(() => filterByDate(purchases, 'date'), [purchases, dateRange]);
  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
  const purchasesChartData = (() => {
    const map: Record<string, number> = {};
    filteredPurchases.forEach((item) => {
      const d = item.date?.slice(0, 10);
      if (!d) return;
      map[d] = (map[d] || 0) + (Number(item.total_amount) || 0);
    });
    let days: string[] = [];
    if (dateRange.from && dateRange.to) {
      let d = new Date(dateRange.from);
      const to = new Date(dateRange.to);
      while (d <= to) {
        const key = d.toISOString().slice(0, 10);
        days.push(key);
        d.setDate(d.getDate() + 1);
      }
    } else {
      days = Object.keys(map).sort();
    }
    return days.map((day) => ({ date: day, value: map[day] || 0 }));
  })();
  const recentPurchases = useMemo(() => {
    return [...filteredPurchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [filteredPurchases]);

  // Section: Expenses
  const filteredExpenses = useMemo(() => filterByDate(expenses, 'date'), [expenses, dateRange]);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const expensesChartData = (() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((item) => {
      const d = item.date?.slice(0, 10);
      if (!d) return;
      map[d] = (map[d] || 0) + (Number(item.amount) || 0);
    });
    let days: string[] = [];
    if (dateRange.from && dateRange.to) {
      let d = new Date(dateRange.from);
      const to = new Date(dateRange.to);
      while (d <= to) {
        const key = d.toISOString().slice(0, 10);
        days.push(key);
        d.setDate(d.getDate() + 1);
      }
    } else {
      days = Object.keys(map).sort();
    }
    return days.map((day) => ({ date: day, value: map[day] || 0 }));
  })();
  const recentExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [filteredExpenses]);

  // Section: Customers
  const recentCustomers = useMemo(() => {
    return [...customers].sort((a, b) => new Date(b.created_at || b.id).getTime() - new Date(a.created_at || a.id).getTime()).slice(0, 10);
  }, [customers]);

  // Section: Product Sales Report (by items)
  const productSalesReport = useMemo(() => {
    // Filter sale items by date range
    const filteredItems = saleItems.filter((item) => {
      if (!dateRange.from || !dateRange.to || !item.sale?.date) return true;
      const from = new Date(dateRange.from);
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999);
      const d = new Date(item.sale.date);
      return d >= from && d <= to;
    });

    // Group by product and aggregate
    const groupedMap = new Map<string, { product_id: string; product_code: string; product_name: string; total_qty: number; total_amount: number }>();
    
    filteredItems.forEach((item) => {
      const productId = item.product_id;
      const productName = item.product?.name || 'Unknown Product';
      const productCode = item.product?.code || '';
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      const discount = Number(item.discount) || 0;
      const tax = Number(item.tax) || 0;
      const amount = (price * qty) - discount + tax;

      if (groupedMap.has(productId)) {
        const existing = groupedMap.get(productId)!;
        existing.total_qty += qty;
        existing.total_amount += amount;
      } else {
        groupedMap.set(productId, {
          product_id: productId,
          product_code: productCode,
          product_name: productName,
          total_qty: qty,
          total_amount: amount,
        });
      }
    });

    return Array.from(groupedMap.values()).sort((a, b) => b.total_amount - a.total_amount);
  }, [saleItems, dateRange]);

  const totalProductSales = productSalesReport.reduce((sum, item) => sum + item.total_amount, 0);
  const totalProductSalesQty = productSalesReport.reduce((sum, item) => sum + item.total_qty, 0);

  // Section: Product Purchase Report (by items)
  const productPurchaseReport = useMemo(() => {
    // Filter purchase items by date range
    const filteredItems = purchaseItems.filter((item) => {
      if (!dateRange.from || !dateRange.to || !item.purchase?.date) return true;
      const from = new Date(dateRange.from);
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999);
      const d = new Date(item.purchase.date);
      return d >= from && d <= to;
    });

    // Group by product and aggregate
    const groupedMap = new Map<string, { product_id: string; product_code: string; product_name: string; total_qty: number; total_amount: number }>();
    
    filteredItems.forEach((item) => {
      const productId = item.product_id;
      const productName = item.product?.name || item.product_name || 'Unknown Product';
      const productCode = item.product?.code || item.product_code || '';
      const qty = Number(item.qty) || 0;
      const cost = Number(item.cost) || 0;
      const discount = Number(item.discount) || 0;
      const tax = Number(item.tax) || 0;
      const amount = (cost * qty) - discount + tax;

      if (groupedMap.has(productId)) {
        const existing = groupedMap.get(productId)!;
        existing.total_qty += qty;
        existing.total_amount += amount;
      } else {
        groupedMap.set(productId, {
          product_id: productId,
          product_code: productCode,
          product_name: productName,
          total_qty: qty,
          total_amount: amount,
        });
      }
    });

    return Array.from(groupedMap.values()).sort((a, b) => b.total_amount - a.total_amount);
  }, [purchaseItems, dateRange]);

  const totalProductPurchases = productPurchaseReport.reduce((sum, item) => sum + item.total_amount, 0);
  const totalProductPurchasesQty = productPurchaseReport.reduce((sum, item) => sum + item.total_qty, 0);

  // Export CSV for each section
  const handleExportCSV = (rows: any[], filename: string) => {
    if (!rows.length) return;
    const csv = [Object.keys(rows[0]).join(','), ...rows.map((r) => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Reports" breadcrumb={<span>Dashboard &gt; <span className="text-gray-900">Reports</span></span>}>
      <div className="p-6 space-y-12">
        {/* Products Section */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaBoxes /> Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <ReportSummaryCard label="Total Products" value={products.length.toString()} icon={<FaBoxes className="text-blue-500" />} />
            <ReportSummaryCard label="Categories" value={categories.length.toString()} icon={<FaTags className="text-green-500" />} />
            <ReportSummaryCard label="Brands" value={brands.length.toString()} icon={<FaTrademark className="text-purple-500" />} />
            <ReportSummaryCard label="Units" value={units.length.toString()} icon={<FaBalanceScale className="text-yellow-500" />} />
          </div>
          <div className="bg-white rounded-xl shadow p-0 overflow-x-auto mb-4">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-semibold">Name</th>
                  <th className="p-4 text-left font-semibold">Category</th>
                  <th className="p-4 text-left font-semibold">Brand</th>
                  <th className="p-4 text-left font-semibold">Created At</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.length === 0 ? (
                  <tr><td className="p-6 text-center text-gray-400" colSpan={4}>No products found</td></tr>
                ) : recentProducts.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{p.name}</td>
                    <td className="p-4">{p.category?.name || ''}</td>
                    <td className="p-4">{p.brand?.name || ''}</td>
                    <td className="p-4">{p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-100 transition flex items-center gap-2" onClick={() => handleExportCSV(recentProducts, 'recent_products.csv')}>
            <FaFileCsv /> Export Products
          </button>
        </section>

        {/* Sales Section */}
        <PermissionGuard
          resource="financial"
          action="read"
          fallback={
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaChartBar /> Sales</h2>
              <div className="bg-white rounded-xl shadow p-6 min-h-[250px] flex flex-col items-center justify-center mb-4">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-4">🔒</div>
                  <div className="text-lg font-semibold mb-2">Financial Data Access Restricted</div>
                  <div>You don't have permission to view sales data</div>
                </div>
              </div>
            </section>
          }
        >
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaChartBar /> Sales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <ReportSummaryCard label="Total Sales" value={formatCurrency(totalSales)} icon={<FaChartBar className="text-blue-500" />} />
            </div>
            <div className="bg-white rounded-xl shadow p-6 min-h-[250px] flex flex-col items-center justify-center mb-4">
              <div className="text-lg font-semibold mb-2">Sales Over Time</div>
              <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                <svg width="100%" height="100%" viewBox={`0 0 ${salesChartData.length * 20} 100`} style={{ maxWidth: 400, height: 80 }}>
                  {salesChartData.map((d, i) => (
                    <rect key={d.date} x={i * 20} y={100 - d.value / (Math.max(...salesChartData.map(x => x.value), 1) / 90)} width={14} height={d.value / (Math.max(...salesChartData.map(x => x.value), 1) / 90)} fill="#3b82f6" />
                  ))}
                </svg>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-0 overflow-x-auto mb-4">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left font-semibold">Invoice</th>
                    <th className="p-4 text-left font-semibold">Customer</th>
                    <th className="p-4 text-left font-semibold">Date</th>
                    <th className="p-4 text-left font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.length === 0 ? (
                    <tr><td className="p-6 text-center text-gray-400" colSpan={4}>No sales found</td></tr>
                  ) : recentSales.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{s.invoice_number || s.reference || s.id}</td>
                      <td className="p-4">{s.customer_name || ''}</td>
                      <td className="p-4">{s.date ? new Date(s.date).toLocaleDateString() : ''}</td>
                      <td className="p-4">{formatCurrency(Number(s.total_amount) || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-100 transition flex items-center gap-2" onClick={() => handleExportCSV(recentSales, 'recent_sales.csv')}>
              <FaFileCsv /> Export Sales
            </button>
          </section>
        </PermissionGuard>

        {/* Purchases Section */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaChartBar /> Purchases</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <ReportSummaryCard label="Total Purchases" value={formatCurrency(totalPurchases)} icon={<FaChartBar className="text-green-500" />} />
          </div>
          <div className="bg-white rounded-xl shadow p-6 min-h-[250px] flex flex-col items-center justify-center mb-4">
            <div className="text-lg font-semibold mb-2">Purchases Over Time</div>
            <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">
              <svg width="100%" height="100%" viewBox={`0 0 ${purchasesChartData.length * 20} 100`} style={{ maxWidth: 400, height: 80 }}>
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  points={purchasesChartData.map((d, i) => `${i * 20},${100 - d.value / (Math.max(...purchasesChartData.map(x => x.value), 1) / 90)}`).join(' ')}
                />
                {purchasesChartData.map((d, i) => (
                  <circle key={d.date} cx={i * 20} cy={100 - d.value / (Math.max(...purchasesChartData.map(x => x.value), 1) / 90)} r={3} fill="#10b981" />
                ))}
              </svg>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-0 overflow-x-auto mb-4">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-semibold">Reference</th>
                  <th className="p-4 text-left font-semibold">Supplier</th>
                  <th className="p-4 text-left font-semibold">Date</th>
                  <th className="p-4 text-left font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.length === 0 ? (
                  <tr><td className="p-6 text-center text-gray-400" colSpan={4}>No purchases found</td></tr>
                ) : recentPurchases.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{p.reference || p.id}</td>
                    <td className="p-4">{p.supplier_name || ''}</td>
                    <td className="p-4">{p.date ? new Date(p.date).toLocaleDateString() : ''}</td>
                    <td className="p-4">{formatCurrency(Number(p.total_amount) || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-100 transition flex items-center gap-2" onClick={() => handleExportCSV(recentPurchases, 'recent_purchases.csv')}>
            <FaFileCsv /> Export Purchases
          </button>
        </section>

        {/* Expenses Section */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaChartBar /> Expenses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <ReportSummaryCard label="Total Expenses" value={formatCurrency(totalExpenses)} icon={<FaChartBar className="text-red-500" />} />
          </div>
          <div className="bg-white rounded-xl shadow p-6 min-h-[250px] flex flex-col items-center justify-center mb-4">
            <div className="text-lg font-semibold mb-2">Expenses Over Time</div>
            <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">
              <svg width="100%" height="100%" viewBox={`0 0 ${expensesChartData.length * 20} 100`} style={{ maxWidth: 400, height: 80 }}>
                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  points={expensesChartData.map((d, i) => `${i * 20},${100 - d.value / (Math.max(...expensesChartData.map(x => x.value), 1) / 90)}`).join(' ')}
                />
                {expensesChartData.map((d, i) => (
                  <circle key={d.date} cx={i * 20} cy={100 - d.value / (Math.max(...expensesChartData.map(x => x.value), 1) / 90)} r={3} fill="#ef4444" />
                ))}
              </svg>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-0 overflow-x-auto mb-4">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-semibold">Category</th>
                  <th className="p-4 text-left font-semibold">Date</th>
                  <th className="p-4 text-left font-semibold">Amount</th>
                  <th className="p-4 text-left font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.length === 0 ? (
                  <tr><td className="p-6 text-center text-gray-400" colSpan={4}>No expenses found</td></tr>
                ) : recentExpenses.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{e.category || ''}</td>
                    <td className="p-4">{e.date ? new Date(e.date).toLocaleDateString() : ''}</td>
                    <td className="p-4">{formatCurrency(Number(e.amount) || 0)}</td>
                    <td className="p-4">{e.description || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-100 transition flex items-center gap-2" onClick={() => handleExportCSV(recentExpenses, 'recent_expenses.csv')}>
            <FaFileCsv /> Export Expenses
          </button>
        </section>

        {/* Customers Section */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaUsers /> Customers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <ReportSummaryCard label="Total Customers" value={customers.length.toString()} icon={<FaUsers className="text-blue-500" />} />
          </div>
          <div className="bg-white rounded-xl shadow p-0 overflow-x-auto mb-4">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-semibold">Name</th>
                  <th className="p-4 text-left font-semibold">Email</th>
                  <th className="p-4 text-left font-semibold">Created At</th>
                </tr>
              </thead>
              <tbody>
                {recentCustomers.length === 0 ? (
                  <tr><td className="p-6 text-center text-gray-400" colSpan={3}>No customers found</td></tr>
                ) : recentCustomers.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{c.name}</td>
                    <td className="p-4">{c.email}</td>
                    <td className="p-4">{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-100 transition flex items-center gap-2" onClick={() => handleExportCSV(recentCustomers, 'recent_customers.csv')}>
            <FaFileCsv /> Export Customers
          </button>
        </section>

        {/* Product Sales Report Section */}
        <PermissionGuard
          resource="financial"
          action="read"
          fallback={
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaBoxes /> Product Sales Report</h2>
              <div className="bg-white rounded-xl shadow p-6 min-h-[250px] flex flex-col items-center justify-center mb-4">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-4">🔒</div>
                  <div className="text-lg font-semibold mb-2">Financial Data Access Restricted</div>
                  <div>You don't have permission to view product sales data</div>
                </div>
              </div>
            </section>
          }
        >
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaBoxes /> Product Sales Report (By Items)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <ReportSummaryCard label="Total Products Sold" value={productSalesReport.length.toString()} icon={<FaBoxes className="text-blue-500" />} />
              <ReportSummaryCard label="Total Quantity Sold" value={totalProductSalesQty.toString()} icon={<FaBoxes className="text-green-500" />} />
              <ReportSummaryCard label="Total Sales Amount" value={formatCurrency(totalProductSales)} icon={<FaChartBar className="text-purple-500" />} />
            </div>
            <div className="bg-white rounded-xl shadow p-0 overflow-x-auto mb-4">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left font-semibold">Product Code</th>
                    <th className="p-4 text-left font-semibold">Product Name</th>
                    <th className="p-4 text-right font-semibold">Total Qty Sold</th>
                    <th className="p-4 text-right font-semibold">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {productSalesReport.length === 0 ? (
                    <tr><td className="p-6 text-center text-gray-400" colSpan={4}>No product sales found</td></tr>
                  ) : productSalesReport.map((item) => (
                    <tr key={item.product_id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{item.product_code}</td>
                      <td className="p-4">{item.product_name}</td>
                      <td className="p-4 text-right">{item.total_qty}</td>
                      <td className="p-4 text-right font-semibold">{formatCurrency(item.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
                {productSalesReport.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold">
                    <tr className="border-t-2">
                      <td className="p-4" colSpan={2}>TOTAL</td>
                      <td className="p-4 text-right">{totalProductSalesQty}</td>
                      <td className="p-4 text-right">{formatCurrency(totalProductSales)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <button className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-100 transition flex items-center gap-2" onClick={() => handleExportCSV(productSalesReport, 'product_sales_report.csv')}>
              <FaFileCsv /> Export Product Sales Report
            </button>
          </section>
        </PermissionGuard>

        {/* Product Purchase Report Section */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaBoxes /> Product Purchase Report (By Items)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <ReportSummaryCard label="Total Products Purchased" value={productPurchaseReport.length.toString()} icon={<FaBoxes className="text-blue-500" />} />
            <ReportSummaryCard label="Total Quantity Purchased" value={totalProductPurchasesQty.toString()} icon={<FaBoxes className="text-green-500" />} />
            <ReportSummaryCard label="Total Purchase Amount" value={formatCurrency(totalProductPurchases)} icon={<FaChartBar className="text-orange-500" />} />
          </div>
          <div className="bg-white rounded-xl shadow p-0 overflow-x-auto mb-4">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-semibold">Product Code</th>
                  <th className="p-4 text-left font-semibold">Product Name</th>
                  <th className="p-4 text-right font-semibold">Total Qty Purchased</th>
                  <th className="p-4 text-right font-semibold">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {productPurchaseReport.length === 0 ? (
                  <tr><td className="p-6 text-center text-gray-400" colSpan={4}>No product purchases found</td></tr>
                ) : productPurchaseReport.map((item) => (
                  <tr key={item.product_id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{item.product_code}</td>
                    <td className="p-4">{item.product_name}</td>
                    <td className="p-4 text-right">{item.total_qty}</td>
                    <td className="p-4 text-right font-semibold">{formatCurrency(item.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
              {productPurchaseReport.length > 0 && (
                <tfoot className="bg-gray-50 font-bold">
                  <tr className="border-t-2">
                    <td className="p-4" colSpan={2}>TOTAL</td>
                    <td className="p-4 text-right">{totalProductPurchasesQty}</td>
                    <td className="p-4 text-right">{formatCurrency(totalProductPurchases)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <button className="border border-gray-300 text-gray-700 bg-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-100 transition flex items-center gap-2" onClick={() => handleExportCSV(productPurchaseReport, 'product_purchase_report.csv')}>
            <FaFileCsv /> Export Product Purchase Report
          </button>
        </section>

        {/* Date Range Filter (applies to sales, purchases, expenses) */}
        <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-lg px-6 py-3 flex gap-2 items-center border">
          <FaCalendarAlt className="text-gray-400" />
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={dateRange.from}
            onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
            aria-label="From date"
          />
          <span className="mx-1">to</span>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={dateRange.to}
            onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
            aria-label="To date"
          />
        </div>
        {loading && <div className="text-center text-gray-400 py-8">Loading...</div>}
        {error && <div className="text-center text-red-500 py-8">{error}</div>}
      </div>
    </AdminLayout>
  );
};

export default Reports; 