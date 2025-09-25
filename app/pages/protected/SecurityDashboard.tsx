import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaEye, FaClock, FaUser, FaDatabase, FaLock } from 'react-icons/fa';
import { useSecurityEvents, useAuditTrail, AuditService } from '../../services/auditService';
import { PermissionGuard } from '../../components/PermissionComponents';

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  warningEvents: number;
  resolvedEvents: number;
  unresolvedEvents: number;
}

interface RecentActivity {
  id: string;
  user_email: string;
  action: string;
  resource: string;
  timestamp: string;
  severity: string;
}

const SecurityDashboard = () => {
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    criticalEvents: 0,
    warningEvents: 0,
    resolvedEvents: 0,
    unresolvedEvents: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get security events and audit trail
  const { securityEvents, loading: securityLoading } = useSecurityEvents({ limit: 100 });
  const { auditLogs, loading: auditLoading } = useAuditTrail({ limit: 50 });

  useEffect(() => {
    const calculateStats = () => {
      const totalEvents = securityEvents.length;
      const criticalEvents = securityEvents.filter(e => e.severity === 'CRITICAL').length;
      const warningEvents = securityEvents.filter(e => e.severity === 'WARNING').length;
      const resolvedEvents = securityEvents.filter(e => e.resolved).length;
      const unresolvedEvents = securityEvents.filter(e => !e.resolved).length;

      setStats({
        totalEvents,
        criticalEvents,
        warningEvents,
        resolvedEvents,
        unresolvedEvents
      });

      // Set recent activity from audit logs
      const activity = auditLogs.slice(0, 10).map(log => ({
        id: log.id,
        user_email: log.user_email,
        action: log.action,
        resource: log.resource,
        timestamp: log.log_timestamp,
        severity: log.severity
      }));
      setRecentActivity(activity);
    };

    if (!securityLoading && !auditLoading) {
      calculateStats();
      setLoading(false);
    }
  }, [securityEvents, auditLogs, securityLoading, auditLoading]);

  const handleResolveEvent = async (eventId: string) => {
    try {
      const { error } = await AuditService.resolveSecurityEvent(eventId);
      if (error) {
        console.error('Error resolving event:', error);
      } else {
        // Refresh data
        window.location.reload();
      }
    } catch (err) {
      console.error('Error resolving event:', err);
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <FaExclamationTriangle className="text-red-600" />;
      case 'ERROR': return <FaExclamationTriangle className="text-red-500" />;
      case 'WARNING': return <FaExclamationTriangle className="text-yellow-600" />;
      case 'INFO': return <FaCheckCircle className="text-blue-600" />;
      default: return <FaEye className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Security Dashboard" breadcrumb={<span>Security &gt; <span className="text-gray-900">Dashboard</span></span>}>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading security dashboard...</div>
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
        <AdminLayout title="Security Dashboard" breadcrumb={<span>Security &gt; <span className="text-gray-900">Dashboard</span></span>}>
          <div className="p-6">
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="text-gray-400">
                <div className="text-6xl mb-4">🔒</div>
                <div className="text-xl font-semibold mb-2">Security Access Restricted</div>
                <div>You don't have permission to view security data</div>
              </div>
            </div>
          </div>
        </AdminLayout>
      }
    >
      <AdminLayout title="Security Dashboard" breadcrumb={<span>Security &gt; <span className="text-gray-900">Dashboard</span></span>}>
        <div className="p-6">
          {/* Security Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white shadow rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FaShieldAlt className="text-blue-500" /> Total Events
              </div>
              <div className="text-2xl font-bold mt-1">{stats.totalEvents}</div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FaExclamationTriangle className="text-red-500" /> Critical
              </div>
              <div className="text-2xl font-bold mt-1 text-red-600">{stats.criticalEvents}</div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FaExclamationTriangle className="text-yellow-500" /> Warnings
              </div>
              <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.warningEvents}</div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FaCheckCircle className="text-green-500" /> Resolved
              </div>
              <div className="text-2xl font-bold mt-1 text-green-600">{stats.resolvedEvents}</div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FaClock className="text-orange-500" /> Unresolved
              </div>
              <div className="text-2xl font-bold mt-1 text-orange-600">{stats.unresolvedEvents}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Security Events */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaShieldAlt className="text-blue-500" /> Recent Security Events
              </h2>
              <div className="space-y-3">
                {securityEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(event.severity)}
                      <div>
                        <div className="font-medium">{event.event_type}</div>
                        <div className="text-sm text-gray-500">{event.description}</div>
                        <div className="text-xs text-gray-400">{new Date(event.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                        {event.severity}
                      </span>
                      {!event.resolved && (
                        <PermissionGuard
                          resource="security"
                          action="resolve"
                          fallback={<div></div>}
                        >
                          <button
                            onClick={() => handleResolveEvent(event.id)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Resolve
                          </button>
                        </PermissionGuard>
                      )}
                    </div>
                  </div>
                ))}
                {securityEvents.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-2" />
                    <div>No security events</div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent User Activity */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaUser className="text-green-500" /> Recent User Activity
              </h2>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FaDatabase className="text-blue-500" />
                      <div>
                        <div className="font-medium">{activity.user_email}</div>
                        <div className="text-sm text-gray-500">
                          {activity.action} {activity.resource}
                        </div>
                        <div className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(activity.severity)}`}>
                      {activity.severity}
                    </span>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <FaEye className="text-gray-400 text-4xl mx-auto mb-2" />
                    <div>No recent activity</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Actions */}
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaLock className="text-red-500" /> Security Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PermissionGuard
                resource="audit"
                action="read"
                fallback={<div></div>}
              >
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                  View Audit Trail
                </button>
              </PermissionGuard>
              
              <PermissionGuard
                resource="audit"
                action="export"
                fallback={<div></div>}
              >
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition">
                  Export Audit Logs
                </button>
              </PermissionGuard>
              
              <PermissionGuard
                resource="security"
                action="manage"
                fallback={<div></div>}
              >
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition">
                  Security Settings
                </button>
              </PermissionGuard>
            </div>
          </div>
        </div>
      </AdminLayout>
    </PermissionGuard>
  );
};

export default SecurityDashboard;
