import AdminLayout from "../layouts/AdminLayout";
import { useEffect, useState } from "react";
import { FaShoppingCart, FaDollarSign, FaStore } from "react-icons/fa";
import { purchasesService } from "../services/purchasesService";
import { salesService } from "../services/salesService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { saleItemsService } from "../services/saleItemsService";
import { productsService } from "../services/productsService";
import { categoriesService } from "../services/categoriesService";
import { customersService } from "../services/customersService";

const Dashboard = () => {
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0);
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pieData, setPieData] = useState<PieDataType[]>([]);
  const [customerSales, setCustomerSales] = useState<CustomerSalesType[]>([]);
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month'>('month');
  const [filterValue, setFilterValue] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-05`;
  });

  // Add types for pieData and customerSales
  type PieDataType = { name: string; value: number; color: string };
  type CustomerSalesType = { name: string; percent: number };

  // Helper to check if a date is in the selected range
  function isInRange(dateStr: string) {
    const date = new Date(dateStr);
    if (filterType === 'day') {
      return date.toISOString().slice(0, 10) === filterValue;
    } else if (filterType === 'week') {
      // filterValue: 'yyyy-Wxx' (ISO week)
      const [year, week] = filterValue.split('-W');
      const d = new Date(date);
      const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
      const pastDaysOfYear = (d.valueOf() - firstDayOfYear.valueOf()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return d.getFullYear() === Number(year) && weekNum === Number(week);
    } else if (filterType === 'month') {
      return date.toISOString().slice(0, 7) === filterValue;
    }
    return true;
  }

  // Helper to get the label for each group
  function getGroupLabel(dateStr: string) {
    const date = new Date(dateStr);
    if (filterType === 'day' || filterType === 'month') {
      // Always use YYYY-MM-DD for day grouping
      return date.toISOString().slice(0, 10);
    } else if (filterType === 'week') {
      // Get ISO week string
      const year = date.getFullYear();
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.valueOf() - firstDayOfYear.valueOf()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return `${year}-W${weekNum.toString().padStart(2, '0')}`;
    }
    return '';
  }

  const [barData, setBarData] = useState<any[]>([]);

  useEffect(() => {
    purchasesService.getAll().then(({ data }) => {
      if (data) {
        // Filter purchases by date
        const filteredPurchases = data.filter((purchase: any) => isInRange(purchase.date));
        const sum = filteredPurchases.reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0);
        setTotalPurchaseAmount(sum);
      } else {
        setTotalPurchaseAmount(0);
      }
    });
    salesService.getAll().then(({ data }) => {
      if (data) {
        // Filter sales by date
        const filteredSales = data.filter((sale: any) => isInRange(sale.date));
        const sum = filteredSales.reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0);
        setTotalSalesAmount(sum);
        setTotalRevenue(sum);
      } else {
        setTotalSalesAmount(0);
        setTotalRevenue(0);
      }
    });

    // Fetch and aggregate for pie chart and customer sales
    Promise.all([
      saleItemsService.getAll(),
      productsService.getAll(),
      categoriesService.getAll(),
      salesService.getAll(),
      purchasesService.getAll(),
      customersService.getAll(),
    ]).then(([
      saleItemsRes,
      productsRes,
      categoriesRes,
      salesRes,
      purchasesRes,
      customersRes
    ]: any[]) => {
      const saleItems: any[] = saleItemsRes.data || [];
      const products: any[] = productsRes.data || [];
      const categories: any[] = categoriesRes.data || [];
      const sales: any[] = salesRes.data || [];
      const purchases: any[] = purchasesRes.data || [];
      const customers: any[] = customersRes.data || [];

      // Debug logs
      console.log('Products:', products);
      console.log('Categories:', categories);
      console.log('SaleItems:', saleItems);

      // Map productId to categoryId (use .id if category is an object)
      const productIdToCategory = Object.fromEntries(products.map(p => [p.id, p.category?.id || p.category]));
      // Map categoryId to name
      const categoryIdToName = Object.fromEntries(categories.map(c => [c.id, c.name]));
      console.log('productIdToCategory:', productIdToCategory);
      console.log('categoryIdToName:', categoryIdToName);

      // Filter sale items and sales by date
      const filteredSaleItems = saleItems.filter((item: any) => {
        const sale = sales.find((s: any) => s.id === item.sale_id);
        return sale && isInRange(sale.date);
      });
      const filteredSales = sales.filter((sale: any) => isInRange(sale.date));

      // For bar chart, use a separate variable to avoid redeclaration
      const filteredSalesForChart = sales.filter((sale: any) => isInRange(sale.date));
      const filteredPurchasesForChart = purchases.filter((purchase: any) => isInRange(purchase.date));
      // Group sales and purchases by group label
      const salesByGroup: Record<string, number> = {};
      filteredSalesForChart.forEach((sale: any) => {
        const label = getGroupLabel(sale.date);
        salesByGroup[label] = (salesByGroup[label] || 0) + (Number(sale.total_amount) || 0);
      });
      const purchasesByGroup: Record<string, number> = {};
      filteredPurchasesForChart.forEach((purchase: any) => {
        const label = getGroupLabel(purchase.date);
        purchasesByGroup[label] = (purchasesByGroup[label] || 0) + (Number(purchase.total_amount) || 0);
      });
      // Get all group labels in sorted order
      const allLabels = Array.from(new Set([...Object.keys(salesByGroup), ...Object.keys(purchasesByGroup)])).sort();
      // Build barData
      let barDataArr = allLabels.map((label: string) => ({
        date: label,
        revenue: salesByGroup[label] || 0,
      }));
      // If filterType is 'month', fill in all days of the month
      if (filterType === 'month') {
        const [year, month] = filterValue.split('-');
        const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
        const allDays = Array.from({ length: daysInMonth }, (_, i) => {
          const day = (i + 1).toString().padStart(2, '0');
          // Always use YYYY-MM-DD format
          return `${year}-${month}-${day}`;
        });
        barDataArr = allDays.map(day => {
          const found = barDataArr.find(d => d.date === day);
          return found || { date: day, revenue: 0 };
        });
      }
      setBarData(barDataArr);
      // Ensure stat card matches chart: sum all revenues in barDataArr
      const totalRevenueValue = barDataArr.reduce((acc: number, d: any) => acc + (Number(d.revenue) || 0), 0);
      setTotalRevenue(totalRevenueValue);

      // Aggregate sales by category
      const categoryTotals: Record<string, number> = {};
      filteredSaleItems.forEach(item => {
        const catId = productIdToCategory[item.product_id];
        if (!catId) return;
        const catName = categoryIdToName[catId] || 'Unknown';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + (Number(item.qty) || 0);
      });
      // Assign colors
      const colors = [
        "#6366f1", "#06b6d4", "#22c55e", "#f59e42", "#ef4444", "#a855f7", "#fbbf24", "#3b82f6", "#10b981", "#64748b"
      ];
      const pieDataArr: PieDataType[] = Object.entries(categoryTotals).map(([name, value], idx) => ({
        name,
        value: Number(value),
        color: colors[idx % colors.length],
      }));
      setPieData(pieDataArr);

      // Map customerId to name
      const customerIdToName = Object.fromEntries(customers.map(c => [c.id, c.name]));
      // Aggregate sales by customer
      const customerTotals: Record<string, number> = {};
      filteredSales.forEach(sale => {
        const custId = sale.customer;
        if (!custId) return;
        customerTotals[custId] = (customerTotals[custId] || 0) + (Number(sale.total_amount) || 0);
      });
      // Convert to array and sort
      const customerArr = Object.entries(customerTotals).map(([id, value]) => ({
        name: customerIdToName[id] || 'Unknown',
        value: Number(value),
      })).sort((a, b) => b.value - a.value);
      // Calculate percentages
      const total = customerArr.reduce((acc, curr) => acc + curr.value, 0);
      const customerSalesArr: CustomerSalesType[] = customerArr.map(c => ({
        name: c.name,
        percent: total ? Math.round((c.value / total) * 100) : 0,
      })).slice(0, 8); // Top 8 customers
      setCustomerSales(customerSalesArr);

      // Debug logs for sales chart
      console.log('All sales:', sales);
      console.log('filteredSalesForChart:', filteredSalesForChart);
      console.log('barDataArr:', barDataArr);
    });
  }, [filterType, filterValue]);

  const stats = [
    { title: "Total Purchase Amount", value: `₱${totalPurchaseAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, icon: <span className="text-green-500 text-xl font-bold">₱</span>, trend: "", trendUp: true },
    { title: "Total Sales Amount", value: `₱${totalSalesAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, icon: <span className="text-blue-500 text-xl font-bold">₱</span>, trend: "", trendUp: true },
    { title: "Total Revenue", value: `₱${(totalSalesAmount - totalPurchaseAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, icon: <FaDollarSign className="text-orange-500" />, trend: "", trendUp: true },
    { title: "Total Franchisee", value: "1,789", icon: <FaStore className="text-red-500" />, trend: "+0.12%", trendUp: true },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Date Filter UI */}
        <div className="flex justify-end items-center gap-2 mb-2">
          <div className="inline-flex rounded-md shadow-sm bg-gray-100">
            {['day', 'week', 'month'].map(type => (
              <button
                key={type}
                className={`px-3 py-1 rounded-l-md text-sm font-medium focus:outline-none transition-colors ${filterType === type ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-100'}`}
                onClick={() => setFilterType(type as 'day' | 'week' | 'month')}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          {filterType === 'day' && (
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
            />
          )}
          {filterType === 'week' && (
            <input
              type="week"
              className="border rounded px-2 py-1 text-sm"
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
            />
          )}
          {filterType === 'month' && (
            <input
              type="month"
              className="border rounded px-2 py-1 text-sm"
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
            />
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ title, value, icon, trend, trendUp }) => (
            <div key={title} className="bg-white shadow rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">{icon} {title}</div>
              <div className="text-2xl font-bold mt-1">{value}</div>
              {trend && <div className={`text-xs flex items-center gap-1 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>{trendUp ? '▲' : '▼'} {trend}</div>}
            </div>
          ))}
        </div>

        {/* Product Sales Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Product sales</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={value => `₱${Number(value).toLocaleString()}`} />
                <Tooltip formatter={value => `₱${Number(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" name="Sales" fill="#f59e42" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category and Country */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white shadow rounded-lg p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Sales by product category</h2>
            <div className="flex-1 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 flex flex-col lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Sales by customers</h2>
            <div className="flex flex-col gap-4 h-full">
              <ul className="text-sm space-y-2 flex-1">
                {customerSales.map((c) => (
                  <li key={c.name} className="flex justify-between">
                    <span className="font-medium">{c.name}</span>
                    <span>{c.percent}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
