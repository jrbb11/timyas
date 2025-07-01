import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChartBar, FaShoppingCart, FaUsers, FaCog, FaTags, FaMoneyBill, FaFileInvoice, FaSun, FaMoon, FaSignOutAlt, FaCreditCard, FaPlus, FaList, FaPrint, FaBoxes, FaThList, FaTrademark, FaBalanceScale, FaFile, FaExchangeAlt, FaHistory } from 'react-icons/fa';

export const Sidebar = () => {
  const [productsOpen, setProductsOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [purchasesOpen, setPurchasesOpen] = useState(false);
  const [stockAdjustmentsOpen, setStockAdjustmentsOpen] = useState(false);

  const handleOpenProducts = () => {
    setProductsOpen((open) => {
      if (!open) {
        setStockAdjustmentsOpen(false);
        setSalesOpen(false);
        setPurchasesOpen(false);
      }
      return !open;
    });
  };
  const handleOpenStockAdjustments = () => {
    setStockAdjustmentsOpen((open) => {
      if (!open) {
        setProductsOpen(false);
        setSalesOpen(false);
        setPurchasesOpen(false);
      }
      return !open;
    });
  };
  const handleOpenSales = () => {
    setSalesOpen((open) => {
      if (!open) {
        setProductsOpen(false);
        setStockAdjustmentsOpen(false);
        setPurchasesOpen(false);
      }
      return !open;
    });
  };
  const handleOpenPurchases = () => {
    setPurchasesOpen((open) => {
      if (!open) {
        setProductsOpen(false);
        setStockAdjustmentsOpen(false);
        setSalesOpen(false);
      }
      return !open;
    });
  };

  return (
    <aside className="w-64 bg-white border-t border-r border-gray-200 h-full hidden md:flex flex-col justify-between">
      <div>
        <div className="p-6 text-xl font-bold border-b border-gray-200">Flup</div>
        <nav className="flex-1 p-4 space-y-6">
          {/* Marketing Section */}
          <div>
            <div className="text-xs text-gray-400 uppercase mb-2">Marketing</div>
            <Link to="/dashboard" className="flex items-center gap-3 text-gray-700 hover:text-primary py-2">
              <FaChartBar /> Dashboard
            </Link>
            {/* Products with submenu */}
            <div className="relative">
              <button
                type="button"
                className={`flex items-center gap-3 text-gray-700 hover:text-primary py-2 w-full ${productsOpen ? 'text-primary font-semibold' : ''}`}
                onClick={handleOpenProducts}
              >
                <FaShoppingCart /> Products
                <span className={`ml-auto transition-transform ${productsOpen ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {productsOpen && (
                <div className="absolute left-full top-0 mt-0 ml-2 w-56 bg-white shadow-lg rounded-md z-10 py-2 border border-gray-100">
                  <a href="/products/create" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <FaPlus /> Create Product
                  </a>
                  <a href="/products/all" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <FaList /> All Products
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <FaPrint /> Print Labels
                  </a>
                  <a href="/products/count-stock" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <FaBoxes /> Count Stock
                  </a>
                  <a href="/products/category" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <FaThList /> Category
                  </a>
                  <a href="/products/brand" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <FaTrademark /> Brand
                  </a>
                  <a href="/products/unit" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <FaBalanceScale /> Unit
                  </a>
                </div>
              )}
            </div>
            {/* Stock Adjustments Section as submenu */}
            <div className="relative mt-2">
              <button
                type="button"
                className={`flex items-center gap-3 text-gray-700 hover:text-primary py-2 w-full ${stockAdjustmentsOpen ? 'text-primary font-semibold' : ''}`}
                onClick={handleOpenStockAdjustments}
              >
                <FaExchangeAlt /> Stock Adjustments
                <span className={`ml-auto transition-transform ${stockAdjustmentsOpen ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {stockAdjustmentsOpen && (
                <div className="absolute left-full top-0 mt-0 ml-2 w-56 bg-white shadow-lg rounded-md z-10 py-2 border border-gray-100 space-y-1">
                  <Link to="/products/stock-adjustments/create" className="flex items-center gap-3 px-4 py-2 pl-6 text-gray-700 hover:bg-gray-50">
                    <FaPlus /> Create Stock Adjustment
                  </Link>
                  <Link to="/products/stock-adjustments" className="flex items-center gap-3 px-4 py-2 pl-6 text-gray-700 hover:bg-gray-50">
                    <FaList /> All Stock Adjustments
                  </Link>
                  <Link to="/products/stock-movement-history" className="flex items-center gap-3 px-4 py-2 pl-6 text-gray-700 hover:bg-gray-50">
                    <FaHistory /> Stock Movement History
                  </Link>
                </div>
              )}
            </div>
            {/* Sales with submenu */}
            <div className="relative">
              <button
                type="button"
                className={`flex items-center gap-3 text-gray-700 hover:text-primary py-2 w-full ${salesOpen ? 'text-primary font-semibold' : ''}`}
                onClick={handleOpenSales}
              >
                <FaFileInvoice /> Sales
                <span className={`ml-auto transition-transform ${salesOpen ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {salesOpen && (
                <div className="absolute left-full top-0 mt-0 ml-2 w-56 bg-white shadow-lg rounded-md z-10 py-2 border border-gray-100">
                  <a href="/sales/create" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <FaFile /> Create Sale
                  </a>
                  <a href="/sales/all" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <FaFile /> All Sales
                  </a>
                  <a href="/sales/shipments" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <FaFile /> Shipments
                  </a>
                </div>
              )}
            </div>
            {/* Purchases with submenu */}
            <div className="relative">
              <button
                type="button"
                className={`flex items-center gap-3 text-gray-700 hover:text-primary py-2 w-full ${purchasesOpen ? 'text-primary font-semibold' : ''}`}
                onClick={handleOpenPurchases}
              >
                <FaCreditCard /> Purchases
                <span className={`ml-auto transition-transform ${purchasesOpen ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {purchasesOpen && (
                <div className="absolute left-full top-0 mt-0 ml-2 w-56 bg-white shadow-lg rounded-md z-10 py-2 border border-gray-100">
                  <a href="/purchases/create" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <FaFile /> Create Purchase
                  </a>
                  <a href="/purchases/all" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <FaFile /> All Purchases
                  </a>
                </div>
              )}
            </div>
            <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-primary py-2">
              <FaTags /> Discounts
            </a>
            <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-primary py-2">
              <FaUsers /> Customers
            </a>
          </div>
          {/* Payments Section */}
          <div>
            <div className="text-xs text-gray-400 uppercase mb-2 mt-4">Payments</div>
            <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-primary py-2">
              <FaMoneyBill /> Ledger
            </a>
            <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-primary py-2">
              <FaFileInvoice /> Taxes
            </a>
          </div>
          {/* System Section */}
          <div>
            <div className="text-xs text-gray-400 uppercase mb-2 mt-4">System</div>
            <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-primary py-2">
              <FaCog /> Settings
            </a>
            {/* Dark mode toggle placeholder */}
            <button className="flex items-center gap-3 text-gray-700 hover:text-primary py-2 mt-2">
              <FaSun className="dark:hidden" />
              <FaMoon className="hidden dark:inline" />
              <span>Dark mode</span>
            </button>
          </div>
        </nav>
      </div>
      {/* User info and logout */}
      <div className="p-4 border-t border-gray-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-300" />
        <div className="flex-1">
          <div className="font-semibold text-sm">Harper Nelson</div>
          <div className="text-xs text-gray-500">Admin Manager</div>
        </div>
        <button className="text-gray-400 hover:text-red-500">
          <FaSignOutAlt />
        </button>
      </div>
    </aside>
  );
};