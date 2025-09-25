import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { FaSearch, FaFilter, FaDownload, FaEye, FaClock, FaUser, FaDatabase, FaExclamationTriangle } from 'react-icons/fa';
import { useAuditTrail, AuditService } from '../../services/auditService';
import { PermissionGuard } from '../../components/PermissionComponents';

interface AuditFilters {
  resource?: string;
  user_id?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  severity?: string;
  category?: string;
}

const AuditTrailViewer = () => {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showFilters, setShowFilters] = useState(false);

  const { auditLogs, loading, error } = useAuditTrail({
    ...filters,
    limit: itemsPerPage,
    offset: currentPage * itemsPerPage
  });

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setCurrentPage(0);
  };

  const handleExport = async () => {
    try {
      // This would implement CSV export functionality
      console.log('Exporting audit logs...');
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'ERROR': return 'text-red-500 bg-red-50';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'INFO': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DATA_CHANGE': return '📝';
      case 'AUTHENTICATION': return '🔐';
      case 'AUTHORIZATION': return '🛡️';
      case 'SYSTEM': return '⚙️';
      case 'SECURITY': return '🚨';
      case 'COMPLIANCE': return '📋';
      default: return '📄';
    }
  };

  const filteredLogs = auditLogs.filter(log =>
    searchTerm === '' || 
    log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="Audit Trail" breadcrumb={<span>Security &gt; <span className="text-gray-900">Audit Trail</span></span>}>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading audit trail...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <PermissionGuard
      resource="audit"
      action="read"
      fallback={
        <AdminLayout title="Audit Trail" breadcrumb={<span>Security &gt; <span className="text-gray-900">Audit Trail</span></span>}>
          <div className="p-6">
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="text-gray-400">
                <div className="text-6xl mb-4">🔒</div>
                <div className="text-xl font-semibold mb-2">Audit Access Restricted</div>
                <div>You don't have permission to view audit logs</div>
              </div>
            </div>
          </div>
        </AdminLayout>
      }
    >
      <AdminLayout title="Audit Trail" breadcrumb={<span>Security &gt; <span className="text-gray-900">Audit Trail</span></span>}>
        <div className="p-6">
          {/* Header with Search and Filters */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex-1 flex gap-2 items-center">
              <div className="relative w-full max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  placeholder="Search audit logs..."
                  className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg w-full text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center gap-2"
              >
                <FaFilter /> Filters
              </button>
            </div>
            <PermissionGuard
              resource="audit"
              action="export"
              fallback={<div></div>}
            >
              <button
                onClick={handleExport}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
              >
                <FaDownload /> Export
              </button>
            </PermissionGuard>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                  <select
                    value={filters.resource || ''}
                    onChange={e => handleFilterChange('resource', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Resources</option>
                    <option value="products">Products</option>
                    <option value="sales">Sales</option>
                    <option value="purchases">Purchases</option>
                    <option value="customers">Customers</option>
                    <option value="users">Users</option>
                    <option value="roles">Roles</option>
                    <option value="permissions">Permissions</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <select
                    value={filters.action || ''}
                    onChange={e => handleFilterChange('action', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Actions</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="VIEW">View</option>
                    <option value="EXPORT">Export</option>
                    <option value="LOGIN">Login</option>
                    <option value="LOGOUT">Logout</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select
                    value={filters.severity || ''}
                    onChange={e => handleFilterChange('severity', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="ERROR">Error</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category || ''}
                    onChange={e => handleFilterChange('category', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="DATA_CHANGE">Data Change</option>
                    <option value="AUTHENTICATION">Authentication</option>
                    <option value="AUTHORIZATION">Authorization</option>
                    <option value="SYSTEM">System</option>
                    <option value="SECURITY">Security</option>
                    <option value="COMPLIANCE">Compliance</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.start_date || ''}
                    onChange={e => handleFilterChange('start_date', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.end_date || ''}
                    onChange={e => handleFilterChange('end_date', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Audit Logs Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <FaClock className="text-gray-400" />
                          {new Date(log.log_timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-gray-400" />
                          <div>
                            <div className="font-medium">{log.user_email}</div>
                            <div className="text-xs text-gray-500">{log.user_role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <FaDatabase className="text-gray-400" />
                          <div>
                            <div className="font-medium">{log.resource}</div>
                            {log.resource_name && (
                              <div className="text-xs text-gray-500">{log.resource_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {log.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(log.category)}</span>
                          <span className="text-xs">{log.category.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <button className="text-blue-600 hover:text-blue-800 p-1">
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <FaDatabase className="text-gray-400 text-4xl mx-auto mb-4" />
                <div className="text-gray-500 text-lg">No audit logs found</div>
                <div className="text-gray-400 text-sm">Try adjusting your filters or search terms</div>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {filteredLogs.length} of {auditLogs.length} audit logs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage + 1}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={filteredLogs.length < itemsPerPage}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </PermissionGuard>
  );
};

export default AuditTrailViewer;
