import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { FaBell, FaExclamationTriangle, FaCheckCircle, FaTimes, FaEye, FaClock, FaUser, FaMapMarkerAlt, FaDesktop } from 'react-icons/fa';
import { useSecurityEvents, AuditService } from '../../services/auditService';
import { PermissionGuard } from '../../components/PermissionComponents';

interface SecurityAlert {
  id: string;
  event_type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  description: string;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

interface AlertFilters {
  severity?: string;
  event_type?: string;
  resolved?: boolean;
  start_date?: string;
  end_date?: string;
}

const SecurityAlerts = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [filters, setFilters] = useState<AlertFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);

  const { securityEvents, loading: securityLoading, refetch } = useSecurityEvents({
    ...filters,
    limit: 100
  });

  useEffect(() => {
    if (!securityLoading) {
      setAlerts(securityEvents.map(event => ({
        ...event,
        description: event.description || ''
      })));
      setLoading(false);
    }
  }, [securityEvents, securityLoading]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await AuditService.resolveSecurityEvent(alertId);
      if (error) {
        console.error('Error resolving alert:', error);
      } else {
        refetch();
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-100 border-red-200';
      case 'ERROR': return 'text-red-500 bg-red-50 border-red-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'INFO': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <FaExclamationTriangle className="text-red-600" />;
      case 'ERROR': return <FaExclamationTriangle className="text-red-500" />;
      case 'WARNING': return <FaExclamationTriangle className="text-yellow-600" />;
      case 'INFO': return <FaBell className="text-blue-600" />;
      default: return <FaBell className="text-gray-600" />;
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'FAILED_LOGIN': return 'Failed Login Attempt';
      case 'PERMISSION_DENIED': return 'Permission Denied';
      case 'SUSPICIOUS_ACTIVITY': return 'Suspicious Activity';
      case 'DATA_BREACH_ATTEMPT': return 'Data Breach Attempt';
      case 'MULTIPLE_FAILED_ATTEMPTS': return 'Multiple Failed Attempts';
      case 'UNUSUAL_ACCESS_PATTERN': return 'Unusual Access Pattern';
      case 'PRIVILEGE_ESCALATION': return 'Privilege Escalation';
      default: return eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleFilterChange = (key: keyof AlertFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filters.severity && alert.severity !== filters.severity) return false;
    if (filters.event_type && alert.event_type !== filters.event_type) return false;
    if (filters.resolved !== undefined) {
      const resolvedValue = typeof filters.resolved === 'string' ? filters.resolved === 'true' : filters.resolved;
      if (alert.resolved !== resolvedValue) return false;
    }
    return true;
  });

  const alertStats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'CRITICAL').length,
    warning: alerts.filter(a => a.severity === 'WARNING').length,
    resolved: alerts.filter(a => a.resolved).length,
    unresolved: alerts.filter(a => !a.resolved).length
  };

  if (loading) {
    return (
      <AdminLayout title="Security Alerts" breadcrumb={<span>Security &gt; <span className="text-gray-900">Alerts</span></span>}>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading security alerts...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <PermissionGuard
      resource="security"
      action="read"
      fallback={
        <AdminLayout title="Security Alerts" breadcrumb={<span>Security &gt; <span className="text-gray-900">Alerts</span></span>}>
          <div className="p-6">
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="text-gray-400">
                <div className="text-6xl mb-4">🔒</div>
                <div className="text-xl font-semibold mb-2">Access Restricted</div>
                <div>You don't have permission to view security alerts</div>
              </div>
            </div>
          </div>
        </AdminLayout>
      }
    >
      <AdminLayout title="Security Alerts" breadcrumb={<span>Security &gt; <span className="text-gray-900">Alerts</span></span>}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Security Alerts</h1>
            <p className="text-gray-600">Monitor and manage security events and alerts</p>
          </div>

          {/* Alert Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{alertStats.total}</p>
                </div>
                <FaBell className="text-gray-400 text-xl" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{alertStats.critical}</p>
                </div>
                <FaExclamationTriangle className="text-red-600 text-xl" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-600">{alertStats.warning}</p>
                </div>
                <FaExclamationTriangle className="text-yellow-600 text-xl" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{alertStats.resolved}</p>
                </div>
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unresolved</p>
                  <p className="text-2xl font-bold text-orange-600">{alertStats.unresolved}</p>
                </div>
                <FaClock className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select
                    value={filters.severity || ''}
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="ERROR">Error</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    value={filters.event_type || ''}
                    onChange={(e) => handleFilterChange('event_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="FAILED_LOGIN">Failed Login</option>
                    <option value="PERMISSION_DENIED">Permission Denied</option>
                    <option value="SUSPICIOUS_ACTIVITY">Suspicious Activity</option>
                    <option value="DATA_BREACH_ATTEMPT">Data Breach Attempt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.resolved === undefined ? '' : filters.resolved.toString()}
                    onChange={(e) => handleFilterChange('resolved', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="false">Unresolved</option>
                    <option value="true">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.start_date || ''}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.end_date || ''}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Alerts List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Security Alerts ({filteredAlerts.length})</h3>

              {filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No security alerts found for the selected filters
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => (
                    <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getSeverityIcon(alert.severity)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{getEventTypeLabel(alert.event_type)}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                                {alert.severity}
                              </span>
                              {alert.resolved && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Resolved
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <FaClock />
                                {getTimeAgo(alert.created_at)}
                              </span>
                              {alert.user_email && (
                                <span className="flex items-center gap-1">
                                  <FaUser />
                                  {alert.user_email}
                                </span>
                              )}
                              {alert.ip_address && (
                                <span className="flex items-center gap-1">
                                  <FaMapMarkerAlt />
                                  {alert.ip_address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!alert.resolved && (
                            <button
                              onClick={() => handleResolveAlert(alert.id)}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Resolve
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <FaEye />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Alert Detail Modal */}
          {selectedAlert && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Alert Details</h3>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Event Type</label>
                    <p className="text-sm text-gray-900">{getEventTypeLabel(selectedAlert.event_type)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Severity</label>
                    <p className={`text-sm px-2 py-1 rounded-full inline-block ${getSeverityColor(selectedAlert.severity)}`}>
                      {selectedAlert.severity}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-900">{selectedAlert.description}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="text-sm text-gray-900">{new Date(selectedAlert.created_at).toLocaleString()}</p>
                  </div>
                  {selectedAlert.user_email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User</label>
                      <p className="text-sm text-gray-900">{selectedAlert.user_email}</p>
                    </div>
                  )}
                  {selectedAlert.ip_address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">IP Address</label>
                      <p className="text-sm text-gray-900">{selectedAlert.ip_address}</p>
                    </div>
                  )}
                  {selectedAlert.user_agent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User Agent</label>
                      <p className="text-sm text-gray-900 break-all">{selectedAlert.user_agent}</p>
                    </div>
                  )}
                  {selectedAlert.metadata && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Metadata</label>
                      <pre className="text-sm text-gray-900 bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(selectedAlert.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedAlert.resolved && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Resolved At</label>
                      <p className="text-sm text-gray-900">{selectedAlert.resolved_at ? new Date(selectedAlert.resolved_at).toLocaleString() : 'N/A'}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  {!selectedAlert.resolved && (
                    <button
                      onClick={() => {
                        handleResolveAlert(selectedAlert.id);
                        setSelectedAlert(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Resolve Alert
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </PermissionGuard>
  );
};

export default SecurityAlerts;
