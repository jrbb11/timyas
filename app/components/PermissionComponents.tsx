// =====================================================
// PERMISSION-BASED COMPONENTS
// =====================================================

import React from 'react';
import { useUserPermissions, useUserRole } from '../services/rbacService';

interface PermissionGuardProps {
  children: React.ReactNode;
  resource: string;
  action: string;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, requires ALL permissions, not just one
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  resource,
  action,
  fallback = null,
  requireAll = false
}) => {
  const { hasPermission, loading } = useUserPermissions();

  if (loading) {
    return null; // Hide completely during loading instead of showing loading text
  }

  const hasAccess = hasPermission(resource, action);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('owner' | 'admin' | 'manager' | 'staff')[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback = null
}) => {
  const { isOwner, isAdmin, isManager, isStaff, loading } = useUserRole();

  if (loading) {
    return null; // Hide completely during loading instead of showing loading text
  }

  const hasAccess = allowedRoles.some(role => {
    switch (role) {
      case 'owner': return isOwner;
      case 'admin': return isAdmin;
      case 'manager': return isManager;
      case 'staff': return isStaff;
      default: return false;
    }
  });

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface PermissionButtonProps {
  children: React.ReactNode;
  resource: string;
  action: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  fallback?: React.ReactNode;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  children,
  resource,
  action,
  onClick,
  className = '',
  disabled = false,
  fallback = null
}) => {
  const { hasPermission, loading } = useUserPermissions();

  if (loading) {
    return <button disabled className={className}>Loading...</button>;
  }

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

interface PermissionLinkProps {
  children: React.ReactNode;
  resource: string;
  action: string;
  to: string;
  className?: string;
  fallback?: React.ReactNode;
}

export const PermissionLink: React.FC<PermissionLinkProps> = ({
  children,
  resource,
  action,
  to,
  className = '',
  fallback = null
}) => {
  const { hasPermission, loading } = useUserPermissions();

  if (loading) {
    return <div className={className}>Loading...</div>;
  }

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return (
    <a href={to} className={className}>
      {children}
    </a>
  );
};

// =====================================================
// ADMIN COMPONENTS
// =====================================================

interface AdminPanelProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  children,
  fallback = <div>Access denied. Admin privileges required.</div>
}) => {
  return (
    <RoleGuard allowedRoles={['owner', 'admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

interface ManagerPanelProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ManagerPanel: React.FC<ManagerPanelProps> = ({
  children,
  fallback = <div>Access denied. Manager privileges required.</div>
}) => {
  return (
    <RoleGuard allowedRoles={['owner', 'admin', 'manager']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

interface OwnerPanelProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const OwnerPanel: React.FC<OwnerPanelProps> = ({
  children,
  fallback = <div>Access denied. Owner privileges required.</div>
}) => {
  return (
    <RoleGuard allowedRoles={['owner']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

// =====================================================
// UTILITY COMPONENTS
// =====================================================

export const PermissionDebugger: React.FC = () => {
  const { permissions, loading, error } = useUserPermissions();
  const { roleLevel, isOwner, isAdmin, isManager, isStaff } = useUserRole();

  if (loading) return <div>Loading debug info...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Permission Debug Info</h3>
      <div className="mb-2">
        <strong>Role Level:</strong> {roleLevel}
        <br />
        <strong>Is Owner:</strong> {isOwner ? 'Yes' : 'No'}
        <br />
        <strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}
        <br />
        <strong>Is Manager:</strong> {isManager ? 'Yes' : 'No'}
        <br />
        <strong>Is Staff:</strong> {isStaff ? 'Yes' : 'No'}
      </div>
      <div>
        <strong>Permissions:</strong>
        <ul className="list-disc list-inside">
          {permissions.map((perm, index) => (
            <li key={index}>{perm.resource}.{perm.action}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
