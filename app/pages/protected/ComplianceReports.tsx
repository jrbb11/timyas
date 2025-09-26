import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { FaFileAlt, FaDownload, FaCalendarAlt, FaUser, FaDatabase, FaShieldAlt, FaChartBar, FaFilter } from 'react-icons/fa';
import { useAuditTrail, AuditService } from '../../services/auditService';
import { PermissionGuard } from '../../components/PermissionComponents';

interface ComplianceReport {
  id: string;
  name: string;
  description: string;
  type: 'SOX' | 'GDPR' | 'PCI_DSS' | 'CUSTOM';
  period: {
    start: string;
    end: string;
  };
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  file_url?: string;
}

interface ReportFilters {
  start_date?: string;
  end_date?: string;
  user_id?: string;
  resource?: string;
  action?: string;
  severity?: string;
}

interface ComplianceMetrics {
  total_events: number;
  user_actions: number;
  data_changes: number;
  security_events: number;
  failed_logins: number;
  permission_denials: number;
  data_exports: number;
  compliance_score: number;
}

const ComplianceReports = () => {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>('');

  const { auditLogs, loading: auditLoading } = useAuditTrail({
    ...filters,
    limit: 1000,
    offset: 0
  });

  useEffect(() => {
    const calculateMetrics = () => {
      if (!auditLogs.length) {
        setMetrics(null);
        setLoading(false);
        return;
      }

      const totalEvents = auditLogs.length;
      const userActions = auditLogs.filter(log => log.category === 'AUTHENTICATION').length;
      const dataChanges = auditLogs.filter(log => log.category === 'DATA_CHANGE').length;
      const securityEvents = auditLogs.filter(log => log.category === 'SECURITY').length;
      const failedLogins = auditLogs.filter(log => log.action === 'LOGIN' && log.severity === 'ERROR').length;
      const permissionDenials = auditLogs.filter(log => log.action === 'PERMISSION_DENIED').length;
      const dataExports = auditLogs.filter(log => log.action === 'EXPORT').length;

      // Calculate compliance score (0-100)
      const complianceScore = Math.max(0, 100 - (failedLogins * 5) - (permissionDenials * 3) - (securityEvents * 2));

      setMetrics({
        total_events: totalEvents,
        user_actions: userActions,
        data_changes: dataChanges,
        security_events: securityEvents,
        failed_logins: failedLogins,
        permission_denials: permissionDenials,
        data_exports: dataExports,
        compliance_score: Math.round(complianceScore)
      });

      setLoading(false);
    };

    if (!auditLoading) {
      calculateMetrics();
    }
  }, [auditLogs, auditLoading]);

  const generateReport = async (type: string) => {
    try {
      setLoading(true);
      // This would call a backend service to generate the report
      console.log(`Generating ${type} compliance report...`);
      
      // Simulate report generation
      const newReport: ComplianceReport = {
        id: Date.now().toString(),
        name: `${type} Compliance Report`,
        description: `Automated ${type} compliance report for the selected period`,
        type: type as any,
        period: {
          start: filters.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: filters.end_date || new Date().toISOString().split('T')[0]
        },
        status: 'GENERATING',
        created_at: new Date().toISOString()
      };

      setReports(prev => [newReport, ...prev]);

      // Simulate completion after 3 seconds
      setTimeout(() => {
        setReports(prev => prev.map(report => 
          report.id === newReport.id 
            ? { ...report, status: 'COMPLETED', file_url: `/reports/${type}-${Date.now()}.pdf` }
            : report
        ));
      }, 3000);

    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (report: ComplianceReport) => {
    if (report.file_url) {
      // This would trigger the actual download
      console.log(`Downloading report: ${report.file_url}`);
      // window.open(report.file_url, '_blank');
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'SOX': return 'Sarbanes-Oxley (SOX)';
      case 'GDPR': return 'General Data Protection Regulation (GDPR)';
      case 'PCI_DSS': return 'Payment Card Industry Data Security Standard (PCI DSS)';
      case 'CUSTOM': return 'Custom Compliance Report';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'GENERATING': return 'text-yellow-600 bg-yellow-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  if (loading) {
    return (
      <AdminLayout title="Compliance Reports" breadcrumb={<span>Security &gt; <span className="text-gray-900">Compliance</span></span>}>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading compliance data...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <PermissionGuard
      resource="audit"
      action="export"
      fallback={
        <AdminLayout title="Compliance Reports" breadcrumb={<span>Security &gt; <span className="text-gray-900">Compliance</span></span>}>
          <div className="p-6">
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="text-gray-400">
                <div className="text-6xl mb-4">🔒</div>
                <div className="text-xl font-semibold mb-2">Access Restricted</div>
                <div>You don't have permission to view compliance reports</div>
              </div>
            </div>
          </div>
        </AdminLayout>
      }
    >
      <AdminLayout title="Compliance Reports" breadcrumb={<span>Security &gt; <span className="text-gray-900">Compliance</span></span>}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Compliance Reports</h1>
            <p className="text-gray-600">Generate and manage compliance reports for various standards</p>
          </div>

          {/* Compliance Metrics */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.total_events}</p>
                  </div>
                  <FaDatabase className="text-gray-400 text-xl" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data Changes</p>
                    <p className="text-2xl font-bold text-blue-600">{metrics.data_changes}</p>
                  </div>
                  <FaChartBar className="text-blue-400 text-xl" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Security Events</p>
                    <p className="text-2xl font-bold text-red-600">{metrics.security_events}</p>
                  </div>
                  <FaShieldAlt className="text-red-400 text-xl" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                    <p className={`text-2xl font-bold ${getComplianceScoreColor(metrics.compliance_score)}`}>
                      {metrics.compliance_score}%
                    </p>
                  </div>
                  <FaFileAlt className="text-green-400 text-xl" />
                </div>
              </div>
            </div>
          )}

          {/* Report Generation */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaFileAlt className="text-blue-500" />
              Generate Compliance Report
            </h3>

            {/* Filters */}
            <div className="mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                <FaFilter />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                    <select
                      value={filters.resource || ''}
                      onChange={(e) => handleFilterChange('resource', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Resources</option>
                      <option value="products">Products</option>
                      <option value="sales">Sales</option>
                      <option value="purchases">Purchases</option>
                      <option value="people">People</option>
                    </select>
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

            {/* Report Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => generateReport('SOX')}
                disabled={loading}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="text-center">
                  <FaFileAlt className="text-blue-500 text-2xl mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900">SOX Report</h4>
                  <p className="text-sm text-gray-600">Sarbanes-Oxley Compliance</p>
                </div>
              </button>

              <button
                onClick={() => generateReport('GDPR')}
                disabled={loading}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="text-center">
                  <FaShieldAlt className="text-green-500 text-2xl mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900">GDPR Report</h4>
                  <p className="text-sm text-gray-600">Data Protection Compliance</p>
                </div>
              </button>

              <button
                onClick={() => generateReport('PCI_DSS')}
                disabled={loading}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="text-center">
                  <FaDatabase className="text-purple-500 text-2xl mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900">PCI DSS Report</h4>
                  <p className="text-sm text-gray-600">Payment Card Security</p>
                </div>
              </button>

              <button
                onClick={() => generateReport('CUSTOM')}
                disabled={loading}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="text-center">
                  <FaChartBar className="text-orange-500 text-2xl mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900">Custom Report</h4>
                  <p className="text-sm text-gray-600">Custom Compliance Report</p>
                </div>
              </button>
            </div>
          </div>

          {/* Generated Reports */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaFileAlt className="text-blue-500" />
                Generated Reports ({reports.length})
              </h3>

              {reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No reports generated yet
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{report.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <FaCalendarAlt />
                              {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaFileAlt />
                              {getReportTypeLabel(report.type)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaUser />
                              {new Date(report.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {report.status === 'COMPLETED' && report.file_url && (
                            <button
                              onClick={() => downloadReport(report)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1"
                            >
                              <FaDownload />
                              Download
                            </button>
                          )}
                          {report.status === 'GENERATING' && (
                            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                              Generating...
                            </div>
                          )}
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

export default ComplianceReports;
