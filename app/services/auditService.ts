// =====================================================
// AUDIT SERVICE - Frontend Integration
// =====================================================
// Service for interacting with the audit logging system
// Provides functions for logging events and retrieving audit data
// =====================================================

import { supabase } from '../utils/supabaseClient';

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  user_role: string;
  action: string;
  resource: string;
  resource_id?: string;
  resource_name?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  log_timestamp: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  category: 'DATA_CHANGE' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'SYSTEM' | 'SECURITY' | 'COMPLIANCE';
  description?: string;
  metadata?: any;
}

export interface SecurityEvent {
  id: string;
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  description?: string;
  metadata?: any;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface AuditFilters {
  resource?: string;
  resource_id?: string;
  user_id?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  severity?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface SecurityEventFilters {
  event_type?: string;
  severity?: string;
  resolved?: boolean;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

// =====================================================
// AUDIT LOGGING FUNCTIONS
// =====================================================

export const AuditService = {
  // Log a general audit event
  async logEvent(
    action: string,
    resource: string,
    resourceId?: string,
    resourceName?: string,
    oldValues?: any,
    newValues?: any,
    description?: string,
    metadata?: any
  ): Promise<{ data: string | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('log_audit_event', {
        p_user_id: user.id,
        p_action: action,
        p_resource: resource,
        p_resource_id: resourceId,
        p_resource_name: resourceName,
        p_old_values: oldValues,
        p_new_values: newValues,
        p_ip_address: await this.getClientIP(),
        p_user_agent: navigator.userAgent,
        p_session_id: user.id, // Using user ID as session ID
        p_severity: 'INFO',
        p_category: 'DATA_CHANGE',
        p_description: description,
        p_metadata: metadata
      });

      return { data, error };
    } catch (error) {
      console.error('Error logging audit event:', error);
      return { data: null, error };
    }
  },

  // Log a data change event
  async logDataChange(
    action: string,
    resource: string,
    resourceId: string,
    resourceName: string,
    oldValues?: any,
    newValues?: any
  ): Promise<{ data: string | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('log_data_change', {
        p_user_id: user.id,
        p_action: action,
        p_resource: resource,
        p_resource_id: resourceId,
        p_resource_name: resourceName,
        p_old_values: oldValues,
        p_new_values: newValues,
        p_ip_address: await this.getClientIP(),
        p_user_agent: navigator.userAgent
      });

      return { data, error };
    } catch (error) {
      console.error('Error logging data change:', error);
      return { data: null, error };
    }
  },

  // Log a security event
  async logSecurityEvent(
    eventType: string,
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'WARNING',
    description?: string,
    metadata?: any
  ): Promise<{ data: string | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_user_id: user?.id,
        p_ip_address: await this.getClientIP(),
        p_user_agent: navigator.userAgent,
        p_severity: severity,
        p_description: description,
        p_metadata: metadata
      });

      return { data, error };
    } catch (error) {
      console.error('Error logging security event:', error);
      return { data: null, error };
    }
  },

  // Log a user action
  async logUserAction(
    action: string,
    resource: string,
    description?: string
  ): Promise<{ data: string | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('log_user_action', {
        p_user_id: user.id,
        p_action: action,
        p_resource: resource,
        p_description: description,
        p_ip_address: await this.getClientIP(),
        p_user_agent: navigator.userAgent
      });

      return { data, error };
    } catch (error) {
      console.error('Error logging user action:', error);
      return { data: null, error };
    }
  },

  // Get client IP address (simplified)
  async getClientIP(): Promise<string> {
    try {
      // In a real application, you'd get this from the server
      // For now, we'll use a placeholder
      return '127.0.0.1';
    } catch (error) {
      return 'unknown';
    }
  },

  // =====================================================
  // AUDIT DATA RETRIEVAL FUNCTIONS
  // =====================================================

  // Get audit trail with filters
  async getAuditTrail(filters: AuditFilters = {}): Promise<{ data: AuditLog[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_audit_trail', {
        p_resource: filters.resource,
        p_resource_id: filters.resource_id,
        p_user_id: filters.user_id,
        p_action: filters.action,
        p_start_date: filters.start_date,
        p_end_date: filters.end_date,
        p_limit: filters.limit || 100,
        p_offset: filters.offset || 0
      });

      return { data, error };
    } catch (error) {
      console.error('Error getting audit trail:', error);
      return { data: null, error };
    }
  },

  // Get security events with filters
  async getSecurityEvents(filters: SecurityEventFilters = {}): Promise<{ data: SecurityEvent[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_security_events', {
        p_event_type: filters.event_type,
        p_severity: filters.severity,
        p_resolved: filters.resolved,
        p_start_date: filters.start_date,
        p_end_date: filters.end_date,
        p_limit: filters.limit || 100,
        p_offset: filters.offset || 0
      });

      return { data, error };
    } catch (error) {
      console.error('Error getting security events:', error);
      return { data: null, error };
    }
  },

  // Get audit logs for a specific resource
  async getResourceAuditLogs(
    resource: string,
    resourceId?: string,
    limit: number = 50
  ): Promise<{ data: AuditLog[] | null; error: any }> {
    return this.getAuditTrail({
      resource,
      resource_id: resourceId,
      limit
    });
  },

  // Get user activity logs
  async getUserActivityLogs(
    userId?: string,
    limit: number = 100
  ): Promise<{ data: AuditLog[] | null; error: any }> {
    return this.getAuditTrail({
      user_id: userId,
      limit
    });
  },

  // Get recent security events
  async getRecentSecurityEvents(limit: number = 50): Promise<{ data: SecurityEvent[] | null; error: any }> {
    return this.getSecurityEvents({
      limit,
      resolved: false
    });
  },

  // =====================================================
  // SECURITY EVENT MANAGEMENT
  // =====================================================

  // Resolve a security event
  async resolveSecurityEvent(eventId: string): Promise<{ data: any; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('security_events')
        .update({
          resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', eventId);

      return { data, error };
    } catch (error) {
      console.error('Error resolving security event:', error);
      return { data: null, error };
    }
  },

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  // Format audit log for display
  formatAuditLog(log: AuditLog): string {
    const timestamp = new Date(log.log_timestamp).toLocaleString();
    const user = log.user_email || 'Unknown User';
    const action = log.action.toLowerCase();
    const resource = log.resource;
    const resourceName = log.resource_name || log.resource_id || 'Unknown';

    return `${timestamp} - ${user} ${action} ${resource} "${resourceName}"`;
  },

  // Get severity color for UI
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'ERROR': return 'text-red-500 bg-red-50';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'INFO': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  },

  // Get category icon for UI
  getCategoryIcon(category: string): string {
    switch (category) {
      case 'DATA_CHANGE': return '📝';
      case 'AUTHENTICATION': return '🔐';
      case 'AUTHORIZATION': return '🛡️';
      case 'SYSTEM': return '⚙️';
      case 'SECURITY': return '🚨';
      case 'COMPLIANCE': return '📋';
      default: return '📄';
    }
  }
};

// =====================================================
// REACT HOOKS FOR AUDIT SYSTEM
// =====================================================

import { useState, useEffect } from 'react';

// Hook for getting audit trail
export const useAuditTrail = (filters: AuditFilters = {}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditTrail = async () => {
      try {
        setLoading(true);
        const { data, error } = await AuditService.getAuditTrail(filters);
        
        if (error) {
          setError(error.message);
        } else {
          setAuditLogs(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch audit trail');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditTrail();
  }, [filters.resource, filters.resource_id, filters.user_id, filters.action, filters.start_date, filters.end_date]);

  return { auditLogs, loading, error, refetch: () => fetchAuditTrail() };
};

// Hook for getting security events
export const useSecurityEvents = (filters: SecurityEventFilters = {}) => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSecurityEvents = async () => {
      try {
        setLoading(true);
        const { data, error } = await AuditService.getSecurityEvents(filters);
        
        if (error) {
          setError(error.message);
        } else {
          setSecurityEvents(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch security events');
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityEvents();
  }, [filters.event_type, filters.severity, filters.resolved, filters.start_date, filters.end_date]);

  return { securityEvents, loading, error, refetch: () => fetchSecurityEvents() };
};

export default AuditService;
