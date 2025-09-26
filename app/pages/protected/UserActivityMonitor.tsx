import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { FaUser, FaClock, FaMapMarkerAlt, FaDesktop, FaMobile, FaTablet, FaEye, FaSearch, FaFilter } from 'react-icons/fa';
import { useAuditTrail, AuditService } from '../../services/auditService';
import { PermissionGuard } from '../../components/PermissionComponents';

interface UserActivity {
  user_email: string;
  user_id: string;
  total_actions: number;
  last_activity: string;
  ip_addresses: string[];
  user_agents: string[];
  actions: {
    action: string;
    count: number;
    last_performed: string;
  }[];
  resources: {
    resource: string;
    count: number;
    last_accessed: string;
  }[];
}

interface ActivityFilters {
  user_email?: string;
  start_date?: string;
  end_date?: string;
  action?: string;
  resource?: string;
}

const UserActivityMonitor = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { auditLogs, loading: auditLoading } = useAuditTrail({
    ...filters,
    limit: 1000,
    offset: 0
  });

  useEffect(() => {
    const processUserActivities = () => {
      if (!auditLogs.length) {
        setActivities([]);
        setLoading(false);
        return;
      }

      const userMap = new Map<string, UserActivity>();

      auditLogs.forEach(log => {
        const userId = log.user_id || 'unknown';
        const userEmail = log.user_email || 'unknown@example.com';

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_email: userEmail,
            user_id: userId,
            total_actions: 0,
            last_activity: log.log_timestamp,
            ip_addresses: [],
            user_agents: [],
            actions: [],
            resources: []
          });
        }

        const activity = userMap.get(userId)!;
        activity.total_actions++;
        
        // Update last activity
        if (new Date(log.log_timestamp) > new Date(activity.last_activity)) {
          activity.last_activity = log.log_timestamp;
        }

        // Collect unique IP addresses
        if (log.ip_address && !activity.ip_addresses.includes(log.ip_address)) {
          activity.ip_addresses.push(log.ip_address);
        }

        // Collect unique user agents
        if (log.user_agent && !activity.user_agents.includes(log.user_agent)) {
          activity.user_agents.push(log.user_agent);
        }

        // Track actions
        const actionIndex = activity.actions.findIndex(a => a.action === log.action);
        if (actionIndex >= 0) {
          activity.actions[actionIndex].count++;
          if (new Date(log.log_timestamp) > new Date(activity.actions[actionIndex].last_performed)) {
            activity.actions[actionIndex].last_performed = log.log_timestamp;
          }
        } else {
          activity.actions.push({
            action: log.action,
            count: 1,
            last_performed: log.log_timestamp
          });
        }

        // Track resources
        const resourceIndex = activity.resources.findIndex(r => r.resource === log.resource);
        if (resourceIndex >= 0) {
          activity.resources[resourceIndex].count++;
          if (new Date(log.log_timestamp) > new Date(activity.resources[resourceIndex].last_accessed)) {
            activity.resources[resourceIndex].last_accessed = log.log_timestamp;
          }
        } else {
          activity.resources.push({
            resource: log.resource,
            count: 1,
            last_accessed: log.log_timestamp
          });
        }
      });

      const sortedActivities = Array.from(userMap.values())
        .sort((a, b) => b.total_actions - a.total_actions);

      setActivities(sortedActivities);
      setLoading(false);
    };

    if (!auditLoading) {
      processUserActivities();
    }
  }, [auditLogs, auditLoading]);

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return <FaMobile className="text-blue-500" />;
    if (userAgent.includes('Tablet')) return <FaTablet className="text-green-500" />;
    return <FaDesktop className="text-gray-500" />;
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

  const handleFilterChange = (key: keyof ActivityFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  if (loading) {
    return (
      <AdminLayout title="User Activity Monitor" breadcrumb={<span>Security &gt; <span className="text-gray-900">User Activity</span></span>}>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading user activities...</div>
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
        <AdminLayout title="User Activity Monitor" breadcrumb={<span>Security &gt; <span className="text-gray-900">User Activity</span></span>}>
          <div className="p-6">
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="text-gray-400">
                <div className="text-6xl mb-4">🔒</div>
                <div className="text-xl font-semibold mb-2">Access Restricted</div>
                <div>You don't have permission to view user activities</div>
              </div>
            </div>
          </div>
        </AdminLayout>
      }
    >
      <AdminLayout title="User Activity Monitor" breadcrumb={<span>Security &gt; <span className="text-gray-900">User Activity</span></span>}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Activity Monitor</h1>
            <p className="text-gray-600">Monitor user activities and access patterns across the system</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FaFilter className="text-blue-500" />
                Filters
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                  <input
                    type="text"
                    value={filters.user_email || ''}
                    onChange={(e) => handleFilterChange('user_email', e.target.value)}
                    placeholder="Filter by user email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <select
                    value={filters.action || ''}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Actions</option>
                    <option value="CREATE">CREATE</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="DELETE">DELETE</option>
                    <option value="VIEW">VIEW</option>
                    <option value="EXPORT">EXPORT</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* User Activities */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaUser className="text-blue-500" />
                User Activities ({activities.length} users)
              </h3>

              {activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No user activities found for the selected filters
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.user_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaUser className="text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{activity.user_email}</h4>
                            <p className="text-sm text-gray-500">ID: {activity.user_id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-blue-600">{activity.total_actions}</div>
                          <div className="text-sm text-gray-500">Total Actions</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Last Activity</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <FaClock className="text-gray-400" />
                            {getTimeAgo(activity.last_activity)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">IP Addresses</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <FaMapMarkerAlt className="text-gray-400" />
                            {activity.ip_addresses.length} unique
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Devices</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            {activity.user_agents.slice(0, 3).map((agent, index) => (
                              <span key={index}>{getDeviceIcon(agent)}</span>
                            ))}
                            {activity.user_agents.length > 3 && (
                              <span className="text-xs text-gray-400">+{activity.user_agents.length - 3}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">Top Actions</div>
                          <div className="space-y-1">
                            {activity.actions
                              .sort((a, b) => b.count - a.count)
                              .slice(0, 3)
                              .map((action) => (
                                <div key={action.action} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{action.action}</span>
                                  <span className="font-medium">{action.count}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">Top Resources</div>
                          <div className="space-y-1">
                            {activity.resources
                              .sort((a, b) => b.count - a.count)
                              .slice(0, 3)
                              .map((resource) => (
                                <div key={resource.resource} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{resource.resource}</span>
                                  <span className="font-medium">{resource.count}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </PermissionGuard>
  );
};

export default UserActivityMonitor;
