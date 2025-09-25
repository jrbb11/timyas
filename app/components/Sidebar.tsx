import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaChartBar, FaShoppingCart, FaUsers, FaCog, FaTags, FaMoneyBill, FaFileInvoice, FaSun, FaMoon, FaSignOutAlt, FaCreditCard, FaPlus, FaList, FaPrint, FaThList, FaTrademark, FaBalanceScale, FaFile, FaExchangeAlt, FaHistory, FaQuestionCircle, FaShieldAlt
} from 'react-icons/fa';
import { supabase } from '../utils/supabaseClient';
import { useRBAC } from '../services/rbacService';

const menu = [
  {
    section: 'MAIN MENU',
    items: [
      { label: 'Dashboard', icon: <FaChartBar />, path: '/dashboard', permission: null }, // Everyone can see dashboard
      {
        label: 'Products', icon: <FaShoppingCart />, permission: { resource: 'products', action: 'read' },
        children: [
          { label: 'Create Product', path: '/products/create', permission: { resource: 'products', action: 'create' } },
          { label: 'All Products', path: '/products/all', permission: { resource: 'products', action: 'read' } },
          { label: 'Print Labels', path: '#', permission: { resource: 'products', action: 'read' } },
          { label: 'Count Stock', path: '/products/count-stock', permission: { resource: 'inventory', action: 'read' } },
          { label: 'Category', path: '/products/category', permission: { resource: 'products', action: 'read' } },
          { label: 'Brand', path: '/products/brand', permission: { resource: 'products', action: 'read' } },
          { label: 'Unit', path: '/products/unit', permission: { resource: 'products', action: 'read' } },
        ]
      },
      {
        label: 'Stock Adjustments', icon: <FaExchangeAlt />, permission: { resource: 'inventory', action: 'adjust' },
        children: [
          { label: 'Create Stock Adjustment', path: '/products/stock-adjustments/create', permission: { resource: 'inventory', action: 'adjust' } },
          { label: 'All Stock Adjustments', path: '/products/stock-adjustments', permission: { resource: 'inventory', action: 'adjust' } },
          { label: 'Stock Movement History', path: '/products/stock-movement-history', permission: { resource: 'inventory', action: 'read' } },
        ]
      },
      {
        label: 'Sales', icon: <FaFileInvoice />, permission: { resource: 'sales', action: 'read' },
        children: [
          { label: 'Create Sale', path: '/sales/create', permission: { resource: 'sales', action: 'create' } },
          { label: 'All Sales', path: '/sales/all', permission: { resource: 'sales', action: 'read' } },
          { label: 'Shipments', path: '/sales/shipments', permission: { resource: 'sales', action: 'read' } },
        ]
      },
      {
        label: 'Purchases', icon: <FaCreditCard />, permission: { resource: 'purchases', action: 'read' },
        children: [
          { label: 'Create Purchase', path: '/purchases/create', permission: { resource: 'purchases', action: 'create' } },
          { label: 'All Purchases', path: '/purchases/all', permission: { resource: 'purchases', action: 'read' } },
        ]
      },
      { label: 'Discounts', icon: <FaTags />, path: '#', permission: { resource: 'sales', action: 'read' } },
      { label: 'Franchisee', icon: <FaUsers />, path: '/customers', permission: { resource: 'users', action: 'read' } },
      { label: 'Reports', icon: <FaChartBar />, path: '/reports', permission: { resource: 'reports', action: 'read' } },
    ]
  },
  {
    section: 'FINANCE',
    items: [
      { label: 'Accounts', icon: <FaCreditCard />, path: '/accounts', permission: { resource: 'financial', action: 'read' } },
      { label: 'Ledger', icon: <FaFile />, path: '/ledger', permission: { resource: 'financial', action: 'read' } },
      { label: 'Deposits', icon: <FaMoneyBill />, path: '/deposits', permission: { resource: 'financial', action: 'read' } },
      { label: 'Expenses', icon: <FaMoneyBill />, path: '/expenses', permission: { resource: 'financial', action: 'read' } },
      { label: 'Transfers', icon: <FaExchangeAlt />, path: '/transfers', permission: { resource: 'financial', action: 'manage' } },
    ]
  },
  {
    section: 'SETTINGS',
    items: [
      { label: 'Payment Methods', icon: <FaFileInvoice />, path: '/payment-methods', permission: { resource: 'system', action: 'manage' } },
      { label: 'Deposit Categories', icon: <FaList />, path: '/deposit-categories', permission: { resource: 'system', action: 'manage' } },
      { label: 'Expense Categories', icon: <FaList />, path: '/expense-categories', permission: { resource: 'system', action: 'manage' } },
      { label: 'Taxes', icon: <FaFileInvoice />, path: '/taxes', permission: { resource: 'system', action: 'manage' } },
      { label: 'People Branch Assignment', icon: <FaUsers />, path: '/settings/people-branches', permission: { resource: 'users', action: 'manage' } },
    ]
  },
  {
    section: 'ADMIN',
    items: [
      { label: 'User Management', icon: <FaShieldAlt />, path: '/admin/users-enhanced', permission: { resource: 'users', action: 'manage' } },
      { label: 'RBAC Test', icon: <FaCog />, path: '/rbac-test', permission: { resource: 'system', action: 'manage' } },
    ]
  },
  {
    section: 'SECURITY',
    items: [
      { label: 'Security Dashboard', icon: <FaShieldAlt />, path: '/security/dashboard', permission: { resource: 'security', action: 'read' } },
      { label: 'Audit Trail', icon: <FaFile />, path: '/security/audit-trail', permission: { resource: 'audit', action: 'read' } },
    ]
  }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use optimized RBAC hook
  const { hasPermission, loading, isOwner, isAdmin, isManager, isStaff } = useRBAC();

  const handleToggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Helper function to check if user has permission
  const canAccess = (permission: { resource: string; action: string } | null): boolean => {
    if (!permission) return true; // No permission required
    return hasPermission(permission.resource, permission.action);
  };

  return (
    <aside className={`bg-white shadow-lg rounded-2xl p-3 flex flex-col ${collapsed ? 'w-20' : 'w-64'} transition-all duration-300 h-screen`}>
      {/* Logo and collapse button */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex-1">
          <img 
            src="/timyslogg.webp" 
            alt="Timyas Lechon Manok" 
            className="w-full h-12 object-contain"
          />
        </div>
        <button onClick={() => setCollapsed(c => !c)} className="text-gray-400 hover:text-gray-700 ml-2">
          <span>{collapsed ? '→' : '←'}</span>
        </button>
      </div>
      {/* Main menu */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          // Professional loading state
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
            <div className="text-sm text-gray-500">Loading menu...</div>
          </div>
        ) : (
          menu.map(section => {
            // Filter items based on permissions
            const visibleItems = section.items.filter(item => canAccess(item.permission));

            // Don't show section if no items are visible
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.section} className="mb-6">
                {!collapsed && <div className="text-xs text-gray-400 mb-2 px-2 uppercase tracking-wider">{section.section}</div>}
                <nav>
                  {visibleItems.map(item => (
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
                              {item.children
                                .filter(sub => canAccess(sub.permission))
                                .map(sub => (
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
            );
          })
        )}
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