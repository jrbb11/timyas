// =====================================================
// RBAC SERVICE - Enhanced Role-Based Access Control
// =====================================================

import { supabase } from '../utils/supabaseClient';

export interface Role {
  id: string;
  name: string;
  level: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface UserRole {
  id: string;
  app_user_id: string;
  role_id: string;
  role_name: string;
  role_level: number;
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
}

export interface UserPermission {
  resource: string;
  action: string;
}

export class RBACService {
  // =====================================================
  // ROLE MANAGEMENT
  // =====================================================
  
  static async getAllRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('level', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async getRoleById(roleId: string): Promise<Role | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return data;
  }

  // =====================================================
  // PERMISSION MANAGEMENT
  // =====================================================
  
  static async getAllPermissions(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('is_active', true)
      .order('resource', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async getPermissionsByResource(resource: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('resource', resource)
      .eq('is_active', true)
      .order('action', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // =====================================================
  // USER ROLE MANAGEMENT
  // =====================================================
  
  static async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        id,
        app_user_id,
        role_id,
        assigned_by,
        assigned_at,
        is_active,
        roles!inner (
          name,
          level
        )
      `)
      .eq('app_user_id', userId)
      .eq('is_active', true);
    
    if (error) throw error;
    
    return data?.map(item => ({
      id: item.id,
      app_user_id: item.app_user_id,
      role_id: item.role_id,
      role_name: item.roles.name,
      role_level: item.roles.level,
      assigned_by: item.assigned_by,
      assigned_at: item.assigned_at,
      is_active: item.is_active
    })) || [];
  }

  static async assignRoleToUser(userId: string, roleId: string, assignedBy: string): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        app_user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString(),
        is_active: true
      });
    
    if (error) throw error;
  }

  static async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .update({ is_active: false })
      .eq('app_user_id', userId)
      .eq('role_id', roleId);
    
    if (error) throw error;
  }

  // =====================================================
  // PERMISSION CHECKING
  // =====================================================
  
  static async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('user_has_permission', {
        p_user_id: userId,
        p_resource: resource,
        p_action: action
      });
      
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  static async getUserPermissions(userId: string): Promise<UserPermission[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_permissions', {
        p_user_id: userId
      });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get user permissions failed:', error);
      return [];
    }
  }

  static async getUserRoleLevel(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_user_roles', {
        p_user_id: userId
      });
      
      if (error) throw error;
      
      // Return the highest role level (lowest number = highest level)
      if (data && data.length > 0) {
        return Math.min(...data.map((role: any) => role.role_level));
      }
      
      return 999; // No roles = lowest level
    } catch (error) {
      console.error('Get user role level failed:', error);
      return 999;
    }
  }

  // =====================================================
  // CONVENIENCE METHODS
  // =====================================================
  
  static async isOwner(userId: string): Promise<boolean> {
    const level = await this.getUserRoleLevel(userId);
    return level === 1;
  }

  static async isAdmin(userId: string): Promise<boolean> {
    const level = await this.getUserRoleLevel(userId);
    return level <= 2;
  }

  static async isManager(userId: string): Promise<boolean> {
    const level = await this.getUserRoleLevel(userId);
    return level <= 3;
  }

  static async isStaff(userId: string): Promise<boolean> {
    const level = await this.getUserRoleLevel(userId);
    return level <= 4;
  }

  // =====================================================
  // ROLE-PERMISSION MANAGEMENT
  // =====================================================
  
  static async getRolePermissions(roleId: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permissions!inner (
          id,
          resource,
          action,
          description,
          is_active,
          created_at
        )
      `)
      .eq('role_id', roleId);
    
    if (error) throw error;
    
    return data?.map(item => item.permissions).filter(p => p.is_active) || [];
  }

  static async addPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await supabase
      .from('role_permissions')
      .insert({
        role_id: roleId,
        permission_id: permissionId
      });
    
    if (error) throw error;
  }

  static async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);
    
    if (error) throw error;
  }
}

// =====================================================
// HOOKS FOR REACT COMPONENTS - OPTIMIZED WITH CACHING
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '../utils/supabaseClient';

// Global cache to prevent multiple API calls
let userPermissionsCache: { [userId: string]: { permissions: UserPermission[], roleLevel: number, timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useUserPermissions = () => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        if (user) {
          // Check cache first
          const cached = userPermissionsCache[user.id];
          const now = Date.now();
          
          if (cached && (now - cached.timestamp) < CACHE_DURATION) {
            setPermissions(cached.permissions);
            setLoading(false);
            return;
          }

          // Fetch fresh data
          const userPermissions = await RBACService.getUserPermissions(user.id);
          const roleLevel = await RBACService.getUserRoleLevel(user.id);
          
          // Update cache
          userPermissionsCache[user.id] = {
            permissions: userPermissions,
            roleLevel: roleLevel,
            timestamp: now
          };
          
          setPermissions(userPermissions);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasPermission = useCallback((resource: string, action: string): boolean => {
    return permissions.some(p => p.resource === resource && p.action === action);
  }, [permissions]);

  return { permissions, loading, error, hasPermission };
};

export const useUserRole = () => {
  const [roleLevel, setRoleLevel] = useState<number>(999);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        if (user) {
          // Check cache first
          const cached = userPermissionsCache[user.id];
          const now = Date.now();
          
          if (cached && (now - cached.timestamp) < CACHE_DURATION) {
            setRoleLevel(cached.roleLevel);
            setLoading(false);
            return;
          }

          // Fetch fresh data
          const level = await RBACService.getUserRoleLevel(user.id);
          
          // Update cache
          if (userPermissionsCache[user.id]) {
            userPermissionsCache[user.id].roleLevel = level;
            userPermissionsCache[user.id].timestamp = now;
          } else {
            userPermissionsCache[user.id] = {
              permissions: [],
              roleLevel: level,
              timestamp: now
            };
          }
          
          setRoleLevel(level);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch role');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  const isOwner = roleLevel === 1;
  const isAdmin = roleLevel <= 2;
  const isManager = roleLevel <= 3;
  const isStaff = roleLevel <= 4;

  return { 
    roleLevel, 
    loading, 
    error, 
    isOwner, 
    isAdmin, 
    isManager, 
    isStaff 
  };
};

// =====================================================
// OPTIMIZED COMBINED HOOK FOR SIDEBAR
// =====================================================

export const useRBAC = () => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [roleLevel, setRoleLevel] = useState<number>(999);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRBAC = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        if (user) {
          // Check cache first
          const cached = userPermissionsCache[user.id];
          const now = Date.now();
          
          if (cached && (now - cached.timestamp) < CACHE_DURATION) {
            setPermissions(cached.permissions);
            setRoleLevel(cached.roleLevel);
            setLoading(false);
            return;
          }

          // Fetch both permissions and role level in parallel
          const [userPermissions, level] = await Promise.all([
            RBACService.getUserPermissions(user.id),
            RBACService.getUserRoleLevel(user.id)
          ]);
          
          // Update cache
          userPermissionsCache[user.id] = {
            permissions: userPermissions,
            roleLevel: level,
            timestamp: now
          };
          
          setPermissions(userPermissions);
          setRoleLevel(level);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch RBAC data');
      } finally {
        setLoading(false);
      }
    };

    fetchRBAC();
  }, []);

  const hasPermission = useCallback((resource: string, action: string): boolean => {
    return permissions.some(p => p.resource === resource && p.action === action);
  }, [permissions]);

  const isOwner = roleLevel === 1;
  const isAdmin = roleLevel <= 2;
  const isManager = roleLevel <= 3;
  const isStaff = roleLevel <= 4;

  return { 
    permissions, 
    roleLevel, 
    loading, 
    error, 
    hasPermission, 
    isOwner, 
    isAdmin, 
    isManager, 
    isStaff 
  };
};
