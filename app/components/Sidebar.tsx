import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaChartBar, FaShoppingCart, FaUsers, FaCog, FaTags, FaMoneyBill, FaFileInvoice, FaSun, FaMoon, FaSignOutAlt, FaCreditCard, FaPlus, FaList, FaPrint, FaBoxes, FaThList, FaTrademark, FaBalanceScale, FaFile, FaExchangeAlt, FaHistory, FaQuestionCircle
} from 'react-icons/fa';
import { supabase } from '../utils/supabaseClient';

const menu = [
  {
    section: 'MAIN MENU',
    items: [
      { label: 'Dashboard', icon: <FaChartBar />, path: '/dashboard' },
      {
        label: 'Products', icon: <FaShoppingCart />, children: [
          { label: 'Create Product', path: '/products/create' },
          { label: 'All Products', path: '/products/all' },
          { label: 'Print Labels', path: '#' },
          { label: 'Count Stock', path: '/products/count-stock' },
          { label: 'Category', path: '/products/category' },
          { label: 'Brand', path: '/products/brand' },
          { label: 'Unit', path: '/products/unit' },
        ]
      },
      {
        label: 'Stock Adjustments', icon: <FaExchangeAlt />, children: [
          { label: 'Create Stock Adjustment', path: '/products/stock-adjustments/create' },
          { label: 'All Stock Adjustments', path: '/products/stock-adjustments' },
          { label: 'Stock Movement History', path: '/products/stock-movement-history' },
        ]
      },
      {
        label: 'Sales', icon: <FaFileInvoice />, children: [
          { label: 'Create Sale', path: '/sales/create' },
          { label: 'All Sales', path: '/sales/all' },
          { label: 'Shipments', path: '/sales/shipments' },
        ]
      },
      {
        label: 'Purchases', icon: <FaCreditCard />, children: [
          { label: 'Create Purchase', path: '/purchases/create' },
          { label: 'All Purchases', path: '/purchases/all' },
        ]
      },
      { label: 'Discounts', icon: <FaTags />, path: '#' },
      { label: 'Franchisee', icon: <FaUsers />, path: '/customers' },
      { label: 'Reports', icon: <FaChartBar />, path: '/reports' },
    ]
  },
  {
    section: 'FINANCE',
    items: [
      { label: 'Accounts', icon: <FaCreditCard />, path: '/accounts' },
      { label: 'Ledger', icon: <FaFile />, path: '/ledger' },
      { label: 'Deposits', icon: <FaMoneyBill />, path: '/deposits' },
      { label: 'Expenses', icon: <FaMoneyBill />, path: '/expenses' },
      { label: 'Transfers', icon: <FaExchangeAlt />, path: '/transfers' },
    ]
  },
  {
    section: 'SETTINGS',
    items: [
      { label: 'Payment Methods', icon: <FaFileInvoice />, path: '/payment-methods' },
      { label: 'Deposit Categories', icon: <FaList />, path: '/deposit-categories' },
      { label: 'Expense Categories', icon: <FaList />, path: '/expense-categories' },
      { label: 'Taxes', icon: <FaFileInvoice />, path: '/taxes' },
      { label: 'People Branch Assignment', icon: <FaUsers />, path: '/settings/people-branches' },
    ]
  }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const location = useLocation();
  const navigate = useNavigate();

  const handleToggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <aside className={`bg-white shadow-lg rounded-2xl p-3 flex flex-col ${collapsed ? 'w-20' : 'w-64'} transition-all duration-300 h-screen`}>
      {/* Logo and collapse button */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-2">
          <div className="bg-green-200 rounded-xl p-2">
            <FaBoxes className="text-green-700 text-2xl" />
          </div>
          {!collapsed && <span className="font-bold text-lg">Timyas Lechon Manok</span>}
        </div>
        <button onClick={() => setCollapsed(c => !c)} className="text-gray-400 hover:text-gray-700">
          <span>{collapsed ? '→' : '←'}</span>
        </button>
      </div>
      {/* Main menu */}
      <div className="flex-1 overflow-y-auto">
        {menu.map(section => (
          <div key={section.section} className="mb-6">
            {!collapsed && <div className="text-xs text-gray-400 mb-2 px-2 uppercase tracking-wider">{section.section}</div>}
            <nav>
              {section.items.map(item => (
                <div key={item.label}>
                  {item.children ? (
                    <>
                      <button
                        className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${openMenus[item.label] ? 'bg-green-50' : ''}`}
                        onClick={() => handleToggleMenu(item.label)}
                      >
                        <span className="text-xl">{item.icon}</span>
                        {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                        {!collapsed && (
                          <span
                            className={`ml-auto transition-transform duration-200 inline-block ${openMenus[item.label] ? 'rotate-180' : ''}`}
                            style={{ fontSize: '1.25rem', fontWeight: 600 }}
                          >
                            ^
                          </span>
                        )}
                      </button>
                      {!collapsed && openMenus[item.label] && (
                        <div className="ml-8 flex flex-col gap-1">
                          {item.children.map(sub => (
                            <Link
                              key={sub.label}
                              to={sub.path}
                              className={`block px-3 py-1 rounded hover:bg-green-100 transition-colors ${location.pathname === sub.path ? 'bg-green-100 font-semibold text-green-900' : ''}`}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${location.pathname === item.path ? 'bg-green-100 font-semibold text-green-900' : ''}`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        ))}
      </div>
      {/* Bottom section */}
      <div className="mt-auto flex flex-col gap-2 px-2 pb-2">
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <FaQuestionCircle /> {!collapsed && 'Help Center'}
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-500" onClick={handleLogout}>
          <FaSignOutAlt /> {!collapsed && 'Logout Account'}
        </button>
      </div>
    </aside>
  );
}