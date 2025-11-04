import AdminLayout from '../../layouts/AdminLayout';
import { useEffect, useState } from "react";
import { FaShoppingCart, FaDollarSign, FaStore, FaSearch } from "react-icons/fa";
import { purchasesService } from '../../services/purchasesService';
import { salesService } from '../../services/salesService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { saleItemsService } from '../../services/saleItemsService';
import { productsService } from '../../services/productsService';
import { categoriesService } from '../../services/categoriesService';
import { customersService } from '../../services/customersService';
import SalesByCustomerTable from '../../components/SalesByCustomerTable';
import { supabase } from '../../utils/supabaseClient';
import { PermissionGuard } from '../../components/PermissionComponents';

const Dashboard = () => {
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0);
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
  const [totalFranchisees, setTotalFranchisees] = useState(0);
  
  // Previous period data for comparison
  const [prevPurchaseAmount, setPrevPurchaseAmount] = useState(0);
  const [prevSalesAmount, setPrevSalesAmount] = useState(0);
  const [prevFranchisees, setPrevFranchisees] = useState(0);
  
  const [pieData, setPieData] = useState<PieDataType[]>([]);
  const [customerSales, setCustomerSales] = useState<CustomerSalesType[]>([]);
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [filterValue, setFilterValue] = useState<string>(() => {
    const now = new Date();
    // Default to current month (YYYY-MM format)
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [search, setSearch] = useState<string>('');

  // Add types for pieData and customerSales
  type PieDataType = { name: string; value: number; color: string };
  type CustomerSalesType = { name: string; percent: number };

  // Helper function to get previous period filter value
  const getPreviousPeriod = (currentFilterValue: string, filterType: string) => {
    if (filterType === 'day') {
      const date = new Date(currentFilterValue);
      date.setDate(date.getDate() - 1);
      return date.toISOString().slice(0, 10);
    } else if (filterType === 'week') {
      const [year, week] = currentFilterValue.split('-W');
      const weekNum = parseInt(week);
      if (weekNum === 1) {
        return `${parseInt(year) - 1}-W52`;
      }
      return `${year}-W${(weekNum - 1).toString().padStart(2, '0')}`;
    } else if (filterType === 'month') {
      const [year, month] = currentFilterValue.split('-');
      const monthNum = parseInt(month);
      if (monthNum === 1) {
        return `${parseInt(year) - 1}-12`;
      }
      return `${year}-${(monthNum - 1).toString().padStart(2, '0')}`;
    } else if (filterType === 'year') {
      return (parseInt(currentFilterValue) - 1).toString();
    }
    return currentFilterValue;
  };

  // Helper function to check if date is in previous period range
  const isInPreviousRange = (dateStr: string, prevFilterValue: string, filterType: string) => {
    const date = new Date(dateStr);
    if (filterType === 'day') {
      return date.toISOString().slice(0, 10) === prevFilterValue;
    } else if (filterType === 'week') {
      const [year, week] = prevFilterValue.split('-W');
      const d = new Date(date);
      const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
      const pastDaysOfYear = (d.valueOf() - firstDayOfYear.valueOf()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return d.getFullYear() === Number(year) && weekNum === Number(week);
    } else if (filterType === 'month') {
      return date.toISOString().slice(0, 7) === prevFilterValue;
    } else if (filterType === 'year') {
      return date.getFullYear().toString() === prevFilterValue;
    }
    return false;
  };

  // Helper function to calculate percentage change
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Helper to check if a date is in the selected range
  function isInRange(dateStr: string | Date) {
    // Normalize date to Date object
    let date: Date;
    if (dateStr instanceof Date) {
      date = dateStr;
    } else if (typeof dateStr === 'string') {
      // Handle different date formats - try parsing as YYYY-MM-DD first
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        date = new Date(dateStr);
      } else if (dateStr.includes('T')) {
        date = new Date(dateStr.split('T')[0]);
      } else {
        date = new Date(dateStr);
      }
    } else {
      return false;
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateStr);
      return false;
    }
    
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
      const dateMonth = date.toISOString().slice(0, 7);
      return dateMonth === filterValue;
    } else if (filterType === 'year') {
      return date.getFullYear().toString() === filterValue;
    }
    return true;
  }

  // Helper to get the label for each group
  function getGroupLabel(dateStr: string) {
    const date = new Date(dateStr);
    if (filterType === 'day') {
      // Always use YYYY-MM-DD for day grouping
      return date.toISOString().slice(0, 10);
    } else if (filterType === 'month') {
      // Use YYYY-MM for month grouping
      return date.toISOString().slice(0, 7);
    } else if (filterType === 'week') {
      // Get ISO week string
      const year = date.getFullYear();
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.valueOf() - firstDayOfYear.valueOf()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return `${year}-W${weekNum.toString().padStart(2, '0')}`;
    } else if (filterType === 'year') {
      // Use YYYY for year grouping
      return date.getFullYear().toString();
    }
    return '';
  }

  const [barData, setBarData] = useState<any[]>([]);

  useEffect(() => {
    const prevFilterValue = getPreviousPeriod(filterValue, filterType);
    
    // Fetch current period data
    purchasesService.getAll().then(({ data }) => {
      if (data) {
        // Filter purchases by current period
        const filteredPurchases = data.filter((purchase: any) => isInRange(purchase.date));
        const sum = filteredPurchases.reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0);
        setTotalPurchaseAmount(sum);
        
        // Filter purchases by previous period
        const prevFilteredPurchases = data.filter((purchase: any) => isInPreviousRange(purchase.date, prevFilterValue, filterType));
        const prevSum = prevFilteredPurchases.reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0);
        setPrevPurchaseAmount(prevSum);
      } else {
        setTotalPurchaseAmount(0);
        setPrevPurchaseAmount(0);
      }
    });
    
    // Fetch sales data for the selected period
    (filterType === 'month' && filterValue
      ? (() => {
          const [year, month] = filterValue.split('-');
          const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
          return supabase
            .from('sales_view')
            .select('*')
            .gte('date', `${filterValue}-01`)
            .lte('date', `${filterValue}-${daysInMonth.toString().padStart(2, '0')}`)
            .order('date', { ascending: false });
        })()
      : salesService.getView()
    ).then(({ data }) => {
      if (data) {
        // Filter sales by current period
        const filteredSales = data.filter((sale: any) => isInRange(sale.date));
        // Calculate sales amount excluding shipping
        const sum = filteredSales.reduce((acc: number, curr: any) => {
          const totalAmount = Number(curr.total_amount) || 0;
          const shipping = Number(curr.shipping) || 0;
          return acc + (totalAmount - shipping);
        }, 0);
        setTotalSalesAmount(sum);
        
        // Filter sales by previous period
        const prevFilteredSales = data.filter((sale: any) => isInPreviousRange(sale.date, prevFilterValue, filterType));
        const prevSum = prevFilteredSales.reduce((acc: number, curr: any) => {
          const totalAmount = Number(curr.total_amount) || 0;
          const shipping = Number(curr.shipping) || 0;
          return acc + (totalAmount - shipping);
        }, 0);
        setPrevSalesAmount(prevSum);
        
        // Calculate Total Revenue = Sales - Purchases (will be calculated after purchases are fetched)
        // For now, we'll calculate it in the stats display
      } else {
        setTotalSalesAmount(0);
        setPrevSalesAmount(0);
      }
    });
    
    // Fetch franchisee count from people_branches_view
    supabase.from('people_branches_view').select('id', { count: 'exact' }).then(({ count, error }) => {
      if (error) {
        console.error('Error fetching franchisee count:', error);
        setTotalFranchisees(0);
        setPrevFranchisees(0);
      } else {
        setTotalFranchisees(count || 0);
        // For franchisees, we'll use a simple comparison (could be enhanced with historical data)
        setPrevFranchisees(Math.max(0, (count || 0) - Math.floor((count || 0) * 0.12)));
      }
    });

    // Fetch and aggregate for pie chart and customer sales
    // For month filter, we need to fetch sales first to get their IDs, then fetch sale_items
    const fetchData = async () => {
      try {
        if (filterType === 'month' && filterValue) {
          // Fetch sales first to get their IDs
          const [year, month] = filterValue.split('-');
          const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
          const salesQuery = supabase
            .from('sales_view')
            .select('*')
            .gte('date', `${filterValue}-01`)
            .lte('date', `${filterValue}-${daysInMonth.toString().padStart(2, '0')}`)
            .order('date', { ascending: false });
          
          const salesRes = await salesQuery;
          if (salesRes.error) {
            console.error('Error fetching sales:', salesRes.error);
            throw salesRes.error;
          }
          const sales = salesRes.data || [];
          
          // Fetch sale_items for these sales
          const saleIds = sales.map(s => s.id);
          let saleItemsRes;
          if (saleIds.length > 0) {
            // Supabase .in() has a limit, so we need to batch if there are too many IDs
            if (saleIds.length > 1000) {
              // Split into batches of 1000
              const batches = [];
              for (let i = 0; i < saleIds.length; i += 1000) {
                batches.push(saleIds.slice(i, i + 1000));
              }
              const batchResults = await Promise.all(
                batches.map(batch => supabase.from('sale_items').select('*').in('sale_id', batch).limit(10000))
              );
              saleItemsRes = {
                data: batchResults.flatMap(r => r.data || []),
                error: batchResults.find(r => r.error)?.error || null
              };
            } else {
              saleItemsRes = await supabase.from('sale_items').select('*').in('sale_id', saleIds).limit(10000);
            }
            if (saleItemsRes.error) {
              console.error('Error fetching sale_items:', saleItemsRes.error);
              // Don't throw, just use empty array
              saleItemsRes = { data: [], error: null };
            }
          } else {
            saleItemsRes = { data: [], error: null };
          }
          
          // Fetch other data
          const [productsRes, categoriesRes, purchasesRes, customersRes] = await Promise.all([
            productsService.getAll(),
            categoriesService.getAll(),
            purchasesService.getAll(),
            customersService.getAll(),
          ]);
          
          return {
            saleItems: saleItemsRes.data || [],
            products: productsRes.data || [],
            categories: categoriesRes.data || [],
            sales: sales,
            purchases: purchasesRes.data || [],
            customers: customersRes.data || [],
          };
        } else {
          // No filter, fetch all
          const [saleItemsRes, productsRes, categoriesRes, salesRes, purchasesRes, customersRes] = await Promise.all([
            saleItemsService.getAll(),
            productsService.getAll(),
            categoriesService.getAll(),
            salesService.getView(),
            purchasesService.getAll(),
            customersService.getAll(),
          ]);
          
          return {
            saleItems: saleItemsRes.data || [],
            products: productsRes.data || [],
            categories: categoriesRes.data || [],
            sales: salesRes.data || [],
            purchases: purchasesRes.data || [],
            customers: customersRes.data || [],
          };
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        // Return empty data on error
        return {
          saleItems: [],
          products: [],
          categories: [],
          sales: [],
          purchases: [],
          customers: [],
        };
      }
    };
    
    fetchData().then(({ saleItems, products, categories, sales, purchases, customers }) => {


      // Map productId to categoryId (use .id if category is an object)
      const productIdToCategory = Object.fromEntries(products.map(p => [p.id, p.category?.id || p.category]));
      // Map categoryId to name
      const categoryIdToName = Object.fromEntries(categories.map(c => [c.id, c.name]));

      // Filter sales by date first
      const filteredSales = sales.filter((sale: any) => isInRange(sale.date));
      
      // Get sale IDs for filtered sales
      const filteredSaleIds = new Set(filteredSales.map((s: any) => s.id));
      
      // Filter sale items by matching sale_id with filtered sales
      const filteredSaleItems = saleItems.filter((item: any) => filteredSaleIds.has(item.sale_id));

      // For bar chart, use a separate variable to avoid redeclaration
      const filteredSalesForChart = sales.filter((sale: any) => isInRange(sale.date));
      const filteredPurchasesForChart = purchases.filter((purchase: any) => isInRange(purchase.date));
      // Group sales and purchases by group label
      const salesByGroup: Record<string, number> = {};
      filteredSalesForChart.forEach((sale: any) => {
        // Normalize date to YYYY-MM-DD format
        let dateStr = sale.date;
        if (dateStr instanceof Date) {
          dateStr = dateStr.toISOString().slice(0, 10);
        } else if (typeof dateStr === 'string') {
          // Handle different date formats
          if (dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
          } else if (dateStr.length > 10) {
            dateStr = dateStr.slice(0, 10);
          }
        }
        
        let label;
        if (filterType === 'day') {
          label = dateStr; // Use full date for day view
        } else if (filterType === 'week') {
          label = dateStr; // Use full date for week view
        } else if (filterType === 'month') {
          label = dateStr; // Use full date (YYYY-MM-DD) for month view to show daily breakdown
        } else if (filterType === 'year') {
          label = dateStr.slice(0, 7); // Use YYYY-MM format for year view
        } else {
          label = getGroupLabel(dateStr); // Fallback
        }
        const totalAmount = Number(sale.total_amount) || 0;
        const shipping = Number(sale.shipping) || 0;
        salesByGroup[label] = (salesByGroup[label] || 0) + (totalAmount - shipping);
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
          return `${year}-${month}-${day}`;
        });
        barDataArr = allDays.map(day => {
          const found = barDataArr.find(d => d.date === day);
          return found || { date: day, revenue: 0 };
        });
      }
      // If filterType is 'year', fill in all months of the year
      else if (filterType === 'year') {
        const year = filterValue;
        const allMonths = Array.from({ length: 12 }, (_, i) => {
          const month = (i + 1).toString().padStart(2, '0');
          return `${year}-${month}`;
        });
        barDataArr = allMonths.map(month => {
          const found = barDataArr.find(d => d.date === month);
          return found || { date: month, revenue: 0 };
        });
      }
      // If filterType is 'week', fill in all 7 days of the week
      else if (filterType === 'week') {
        const [year, week] = filterValue.split('-W');
        // Calculate the start date of the week
        const firstDayOfYear = new Date(Number(year), 0, 1);
        const daysToAdd = (Number(week) - 1) * 7;
        const startDate = new Date(firstDayOfYear);
        startDate.setDate(startDate.getDate() + daysToAdd);
        
        const allDays = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          return date.toISOString().slice(0, 10);
        });
        
        barDataArr = allDays.map(day => {
          const found = barDataArr.find(d => d.date === day);
          return found || { date: day, revenue: 0 };
        });
      }
      // If filterType is 'day', show only that day
      else if (filterType === 'day') {
        barDataArr = barDataArr.filter(item => item.date === filterValue);
        if (barDataArr.length === 0) {
          barDataArr = [{ date: filterValue, revenue: 0 }];
        }
      }
      setBarData(barDataArr);

      // Aggregate sales by category
      // Calculate category totals from sales directly, distributing proportionally by items
      const categoryTotals: Record<string, number> = {};
      
      // First pass: calculate item totals per sale for proportions
      const saleItemTotals: Record<string, number> = {}; // sale_id -> total item amount
      filteredSaleItems.forEach(item => {
        const saleId = item.sale_id;
        const itemTotal = (Number(item.price) || 0) * (Number(item.qty) || 0) - (Number(item.discount) || 0) + (Number(item.tax) || 0);
        saleItemTotals[saleId] = (saleItemTotals[saleId] || 0) + itemTotal;
      });
      
      // Second pass: distribute sale amounts to categories proportionally
      filteredSales.forEach(sale => {
        const saleId = sale.id;
        const saleTotalAmount = Number(sale.total_amount) || 0;
        const saleShipping = Number(sale.shipping) || 0;
        const saleNetAmount = saleTotalAmount - saleShipping;
        
        // Get all items for this sale
        const saleItems = filteredSaleItems.filter((item: any) => item.sale_id === saleId);
        const saleItemsTotal = saleItemTotals[saleId] || 0;
        
        if (saleItems.length === 0) {
          // Sales without items - add to "Uncategorized"
          categoryTotals['Uncategorized'] = (categoryTotals['Uncategorized'] || 0) + saleNetAmount;
          return;
        }
        
        // Distribute sale net amount proportionally among items
        saleItems.forEach((item: any) => {
          const catId = productIdToCategory[item.product_id];
          const catName = catId ? (categoryIdToName[catId] || 'Unknown') : 'Uncategorized';
          
          const itemTotal = (Number(item.price) || 0) * (Number(item.qty) || 0) - (Number(item.discount) || 0) + (Number(item.tax) || 0);
          
          let categoryAmount = 0;
          if (saleItemsTotal > 0) {
            // Proportion of this item in the sale
            const itemProportion = itemTotal / saleItemsTotal;
            // Apply proportion to sale net amount
            categoryAmount = saleNetAmount * itemProportion;
          } else {
            // Fallback: distribute equally
            categoryAmount = saleNetAmount / saleItems.length;
          }
          
          categoryTotals[catName] = (categoryTotals[catName] || 0) + categoryAmount;
        });
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

      // Aggregate sales by customer (from sales_view, customer is already the name)
      const customerTotals: Record<string, number> = {};
      filteredSales.forEach(sale => {
        const customerName = sale.customer; // sales_view has customer as name, not ID
        if (!customerName) return;
        const totalAmount = Number(sale.total_amount) || 0;
        const shipping = Number(sale.shipping) || 0;
        customerTotals[customerName] = (customerTotals[customerName] || 0) + (totalAmount - shipping);
      });
      // Convert to array and sort
      const customerArr = Object.entries(customerTotals).map(([name, value]) => ({
        name: name,
        value: Number(value),
      })).sort((a, b) => b.value - a.value);
      // Calculate percentages
      const total = customerArr.reduce((acc, curr) => acc + curr.value, 0);
      const customerSalesArr: CustomerSalesType[] = customerArr.map(c => ({
        name: c.name,
        percent: total ? Math.round((c.value / total) * 100) : 0,
      })).slice(0, 8); // Top 8 customers
      setCustomerSales(customerSalesArr);

    }).catch((error) => {
      console.error('Error in fetchData promise:', error);
    });
  }, [filterType, filterValue]);

  const stats = [
    { 
      title: "Total Purchase Amount", 
      value: `₱${totalPurchaseAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 
      icon: <span className="text-green-500 text-xl font-bold">₱</span>, 
      trend: `${calculatePercentageChange(totalPurchaseAmount, prevPurchaseAmount) >= 0 ? '+' : ''}${calculatePercentageChange(totalPurchaseAmount, prevPurchaseAmount).toFixed(2)}%`, 
      trendUp: calculatePercentageChange(totalPurchaseAmount, prevPurchaseAmount) >= 0 
    },
    { 
      title: "Total Sales Amount", 
      value: `₱${totalSalesAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 
      icon: <span className="text-blue-500 text-xl font-bold">₱</span>, 
      trend: `${calculatePercentageChange(totalSalesAmount, prevSalesAmount) >= 0 ? '+' : ''}${calculatePercentageChange(totalSalesAmount, prevSalesAmount).toFixed(2)}%`, 
      trendUp: calculatePercentageChange(totalSalesAmount, prevSalesAmount) >= 0 
    },
    { 
      title: "Total Revenue", 
      value: `₱${(totalSalesAmount - totalPurchaseAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 
      icon: <FaDollarSign className="text-orange-500" />, 
      trend: `${calculatePercentageChange(totalSalesAmount - totalPurchaseAmount, prevSalesAmount - prevPurchaseAmount) >= 0 ? '+' : ''}${calculatePercentageChange(totalSalesAmount - totalPurchaseAmount, prevSalesAmount - prevPurchaseAmount).toFixed(2)}%`, 
      trendUp: calculatePercentageChange(totalSalesAmount - totalPurchaseAmount, prevSalesAmount - prevPurchaseAmount) >= 0 
    },
    { 
      title: "Total Franchisee", 
      value: totalFranchisees.toLocaleString(), 
      icon: <FaStore className="text-red-500" />, 
      trend: `${calculatePercentageChange(totalFranchisees, prevFranchisees) >= 0 ? '+' : ''}${calculatePercentageChange(totalFranchisees, prevFranchisees).toFixed(2)}%`, 
      trendUp: calculatePercentageChange(totalFranchisees, prevFranchisees) >= 0 
    },
  ];

  return (
    <AdminLayout title="Dashboard" breadcrumb={<span>Dashboard</span>}>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          {/* No search input needed for dashboard */}
        </div>
        <div className="space-y-6">
          {/* Date Filter UI */}
          <div className="flex justify-end items-center gap-2 mb-2">
            <div className="inline-flex rounded-md shadow-sm bg-gray-100">
              {['day', 'week', 'month', 'year'].map((type, index) => (
                <button
                  key={type}
                  className={`px-3 py-1 text-sm font-medium focus:outline-none transition-colors ${
                    index === 0 ? 'rounded-l-md' : index === 3 ? 'rounded-r-md' : ''
                  } ${filterType === type ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-100'}`}
                  onClick={() => {
                    const now = new Date();
                    let newValue = '';
                    
                    if (type === 'day') {
                      newValue = now.toISOString().slice(0, 10); // YYYY-MM-DD
                    } else if (type === 'week') {
                      // Get ISO week
                      const year = now.getFullYear();
                      const firstDayOfYear = new Date(year, 0, 1);
                      const pastDaysOfYear = (now.valueOf() - firstDayOfYear.valueOf()) / 86400000;
                      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
                      newValue = `${year}-W${weekNum.toString().padStart(2, '0')}`;
                    } else if (type === 'month') {
                      newValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
                    } else if (type === 'year') {
                      newValue = now.getFullYear().toString(); // YYYY
                    }
                    
                    setFilterType(type as 'day' | 'week' | 'month' | 'year');
                    setFilterValue(newValue);
                  }}
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
            {filterType === 'year' && (
              <input
                type="number"
                className="border rounded px-2 py-1 text-sm"
                value={filterValue}
                onChange={e => setFilterValue(e.target.value)}
                min="2020"
                max="2030"
                placeholder="Year"
              />
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ title, value, icon, trend, trendUp }) => {
              // Determine if this is financial data
              const isFinancial = title.includes('Sales Amount') || title.includes('Revenue') || title.includes('Purchase Amount');
              
              const card = (
                <div key={title} className="bg-white shadow rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">{icon} {title}</div>
                  <div className="text-2xl font-bold mt-1">{value}</div>
                  {trend && <div className={`text-xs flex items-center gap-1 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>{trendUp ? '▲' : '▼'} {trend}</div>}
                </div>
              );

              // Protect financial data
              if (isFinancial) {
                return (
                  <PermissionGuard
                    key={title}
                    resource="financial"
                    action="read"
                    fallback={
                      <div className="bg-white shadow rounded-lg p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">{icon} {title}</div>
                        <div className="text-2xl font-bold mt-1 text-gray-400">***</div>
                        <div className="text-xs text-gray-400">Access Restricted</div>
                      </div>
                    }
                  >
                    {card}
                  </PermissionGuard>
                );
              }

              return card;
            })}
          </div>

          {/* Product Sales Chart */}
          <PermissionGuard
            resource="financial"
            action="read"
            fallback={
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Sales Overview</h2>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔒</div>
                    <div>Financial data access restricted</div>
                  </div>
                </div>
              </div>
            }
          >
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Sales Overview</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={filterType === 'month' ? 0 : 'preserveStartEnd'}
                    />
                    <YAxis fontSize={12} tickFormatter={value => `₱${Number(value).toLocaleString()}`} />
                    <Tooltip formatter={value => `₱${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="revenue" name="Sales" fill="#f59e42" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </PermissionGuard>

          {/* Sales by Category and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <PermissionGuard
              resource="financial"
              action="read"
              fallback={
                <div className="bg-white shadow rounded-lg p-6 flex flex-col">
                  <h2 className="text-lg font-semibold mb-4">Sales by product category</h2>
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔒</div>
                      <div>Financial data access restricted</div>
                    </div>
                  </div>
                </div>
              }
            >
              <div className="bg-white shadow rounded-lg p-6 flex flex-col">
                <h2 className="text-lg font-semibold mb-4">Sales by product category</h2>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        paddingAngle={2}
                        label={false}
                        labelLine={false}
                      >
                        {pieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => `₱${Number(value).toLocaleString()}`}
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        formatter={(value: any, entry: any) => {
                          const item = pieData.find(p => p.name === value);
                          const amount = item ? `₱${Number(item.value).toLocaleString()}` : '';
                          return `${value} — ${amount}`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </PermissionGuard>
            <PermissionGuard
              resource="financial"
              action="read"
              fallback={
                <div className="bg-white shadow rounded-lg p-6 flex flex-col lg:col-span-2">
                  <h2 className="text-lg font-semibold mb-4">Sales by customers</h2>
                  <div className="flex flex-col gap-4 h-full items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔒</div>
                      <div>Financial data access restricted</div>
                    </div>
                  </div>
                </div>
              }
            >
              <div className="bg-white shadow rounded-lg p-6 flex flex-col lg:col-span-2">
                <h2 className="text-lg font-semibold mb-4">Sales by customers</h2>
                <div className="flex flex-col gap-4 h-full">
                  <SalesByCustomerTable filterValue={filterValue} filterType={filterType} />
                </div>
              </div>
            </PermissionGuard>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
