import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  PermissionGuard, 
  RoleGuard, 
  AdminPanel, 
  ManagerPanel, 
  OwnerPanel,
  PermissionButton,
  PermissionDebugger 
} from '../../components/PermissionComponents';

const RBACTestPage = () => {
  return (
    <AdminLayout 
      title="RBAC Test Page" 
      breadcrumb={<span>Admin &gt; <span className="text-gray-900">RBAC Test</span></span>}
    >
      <div className="p-6 space-y-6">
        {/* Debug Info */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Current User Permissions</h2>
          <PermissionDebugger />
        </div>

        {/* Permission Guards */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Permission Guards</h2>
          <div className="space-y-4">
            
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Users Management</h3>
              <PermissionGuard resource="users" action="create">
                <div className="text-green-600">✅ Can create users</div>
              </PermissionGuard>
              <PermissionGuard resource="users" action="read">
                <div className="text-green-600">✅ Can view users</div>
              </PermissionGuard>
              <PermissionGuard resource="users" action="manage">
                <div className="text-green-600">✅ Can manage user roles</div>
              </PermissionGuard>
            </div>

            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Products Management</h3>
              <PermissionGuard resource="products" action="create">
                <div className="text-green-600">✅ Can create products</div>
              </PermissionGuard>
              <PermissionGuard resource="products" action="read">
                <div className="text-green-600">✅ Can view products</div>
              </PermissionGuard>
              <PermissionGuard resource="products" action="delete">
                <div className="text-green-600">✅ Can delete products</div>
              </PermissionGuard>
            </div>

            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Financial Management</h3>
              <PermissionGuard resource="financial" action="read">
                <div className="text-green-600">✅ Can view financial data</div>
              </PermissionGuard>
              <PermissionGuard resource="financial" action="manage">
                <div className="text-green-600">✅ Can manage financial settings</div>
              </PermissionGuard>
            </div>

            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">System Management</h3>
              <PermissionGuard resource="system" action="manage">
                <div className="text-green-600">✅ Can manage system settings</div>
              </PermissionGuard>
              <PermissionGuard resource="system" action="audit">
                <div className="text-green-600">✅ Can view audit logs</div>
              </PermissionGuard>
            </div>
          </div>
        </div>

        {/* Role Guards */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Role Guards</h2>
          <div className="space-y-4">
            
            <OwnerPanel>
              <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800">Owner Panel</h3>
                <p className="text-red-700">This content is only visible to Owners</p>
              </div>
            </OwnerPanel>

            <AdminPanel>
              <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Admin Panel</h3>
                <p className="text-blue-700">This content is visible to Owners and Admins</p>
              </div>
            </AdminPanel>

            <ManagerPanel>
              <div className="border border-green-200 bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Manager Panel</h3>
                <p className="text-green-700">This content is visible to Owners, Admins, and Managers</p>
              </div>
            </ManagerPanel>

            <RoleGuard allowedRoles={['owner', 'admin', 'manager', 'staff']}>
              <div className="border border-gray-200 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800">Staff Panel</h3>
                <p className="text-gray-700">This content is visible to all roles</p>
              </div>
            </RoleGuard>
          </div>
        </div>

        {/* Permission Buttons */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Permission Buttons</h2>
          <div className="space-y-4">
            
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Action Buttons</h3>
              <div className="flex gap-2">
                <PermissionButton
                  resource="users"
                  action="create"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={() => alert('Create User clicked!')}
                >
                  Create User
                </PermissionButton>

                <PermissionButton
                  resource="products"
                  action="delete"
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  onClick={() => alert('Delete Product clicked!')}
                >
                  Delete Product
                </PermissionButton>

                <PermissionButton
                  resource="financial"
                  action="manage"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={() => alert('Manage Financial clicked!')}
                >
                  Manage Financial
                </PermissionButton>
              </div>
            </div>
          </div>
        </div>

        {/* Test Different Scenarios */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Test Scenarios</h2>
          <div className="space-y-4">
            
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Mixed Permissions</h3>
              <p className="text-sm text-gray-600 mb-2">
                This section shows how different permission levels work together
              </p>
              
              <div className="space-y-2">
                <PermissionGuard resource="users" action="read">
                  <div className="text-sm text-green-600">• Can view user list</div>
                </PermissionGuard>
                
                <PermissionGuard resource="users" action="create">
                  <div className="text-sm text-green-600">• Can add new users</div>
                </PermissionGuard>
                
                <PermissionGuard resource="users" action="manage">
                  <div className="text-sm text-green-600">• Can assign roles to users</div>
                </PermissionGuard>
                
                <PermissionGuard resource="system" action="audit">
                  <div className="text-sm text-green-600">• Can view audit logs</div>
                </PermissionGuard>
              </div>
            </div>

            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Fallback Content</h3>
              <p className="text-sm text-gray-600 mb-2">
                This shows how fallback content appears when permissions are denied
              </p>
              
              <PermissionGuard 
                resource="system" 
                action="manage"
                fallback={<div className="text-red-600 text-sm">❌ System management access denied</div>}
              >
                <div className="text-green-600 text-sm">✅ System management access granted</div>
              </PermissionGuard>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default RBACTestPage;
