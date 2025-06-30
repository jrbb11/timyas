import AdminLayout from "../layouts/AdminLayout";
import { useEffect, useState } from "react";
import { FaShoppingCart, FaDollarSign, FaStore } from "react-icons/fa";
import { purchasesService } from "../services/purchasesService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const barData = [
  { date: "1 Jul", margin: 20000, revenue: 40000 },
  { date: "2 Jul", margin: 30000, revenue: 50000 },
  { date: "3 Jul", margin: 25000, revenue: 60000 },
  { date: "4 Jul", margin: 40000, revenue: 65000 },
  { date: "5 Jul", margin: 52000, revenue: 70000 },
  { date: "6 Jul", margin: 52187, revenue: 68000 },
  { date: "7 Jul", margin: 41000, revenue: 62000 },
  { date: "8 Jul", margin: 30000, revenue: 50000 },
  { date: "9 Jul", margin: 35000, revenue: 60000 },
  { date: "10 Jul", margin: 42000, revenue: 67000 },
  { date: "11 Jul", margin: 48000, revenue: 71000 },
  { date: "12 Jul", margin: 53000, revenue: 72000 },
];

const pieData = [
  { name: "Living room", value: 25, color: "#6366f1" },
  { name: "Kids", value: 17, color: "#06b6d4" },
  { name: "Office", value: 13, color: "#22c55e" },
  { name: "Bedroom", value: 12, color: "#f59e42" },
  { name: "Kitchen", value: 9, color: "#ef4444" },
  { name: "Bathroom", value: 8, color: "#a855f7" },
  { name: "Dining room", value: 6, color: "#fbbf24" },
  { name: "Decor", value: 5, color: "#3b82f6" },
  { name: "Lighting", value: 3, color: "#10b981" },
  { name: "Outdoor", value: 2, color: "#64748b" },
];

const customerSales = [
  { name: "Juan Dela Cruz", percent: 22 },
  { name: "Maria Santos", percent: 18 },
  { name: "Pedro Reyes", percent: 15 },
  { name: "Ana Lopez", percent: 13 },
  { name: "Jose Ramos", percent: 11 },
  { name: "Liza Garcia", percent: 9 },
  { name: "Carlos Mendoza", percent: 7 },
  { name: "Grace Lim", percent: 5 },
];

const Dashboard = () => {
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0);

  useEffect(() => {
    purchasesService.getAll().then(({ data }) => {
      if (data) {
        const sum = data.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
        setTotalPurchaseAmount(sum);
      } else {
        setTotalPurchaseAmount(0);
      }
    });
  }, []);

  const stats = [
    { title: "Total Purchase Amount", value: `₱${totalPurchaseAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, icon: <span className="text-green-500 text-xl font-bold">₱</span>, trend: "", trendUp: true },
    { title: "Total Revenue", value: "₱3,465,000", icon: <span className="text-green-500 text-xl font-bold">₱</span>, trend: "+0.5%", trendUp: true },
    { title: "Total Orders", value: "1,136,000", icon: <FaShoppingCart className="text-purple-500" />, trend: "-0.2%", trendUp: false },
    { title: "Total Franchisee", value: "1,789", icon: <FaStore className="text-red-500" />, trend: "+0.12%", trendUp: true },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
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
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="margin" name="Gross margin" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name="Revenue" fill="#f59e42" radius={[4, 4, 0, 0]} />
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
