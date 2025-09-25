import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { supabase } from '../../utils/supabaseClient';
import { RBACService, Role, UserRole } from '../../services/rbacService';
import { PermissionGuard, RoleGuard, AdminPanel } from '../../components/PermissionComponents';
import { FaEdit, FaTrash, FaUserPlus, FaShieldAlt } from 'react-icons/fa';

interface AppUser {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  contact_number: string;
  approved: boolean;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<{ [userId: string]: UserRole[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch roles
      const rolesData = await RBACService.getAllRoles();

      // Fetch user roles for all users
      const userRolesMap: { [userId: string]: UserRole[] } = {};
      for (const user of usersData || []) {
        const userRolesData = await RBACService.getUserRoles(user.id);
        userRolesMap[user.id] = userRolesData;
      }

      setUsers(usersData || []);
      setRoles(rolesData);
      setUserRoles(userRolesMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) return;

    try {
      // Get current user (the one assigning the role)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!appUser) throw new Error('App user not found');

      await RBACService.assignRoleToUser(selectedUser.id, selectedRoleId, appUser.id);
      
      // Refresh user roles
      const updatedUserRoles = await RBACService.getUserRoles(selectedUser.id);
      setUserRoles(prev => ({
        ...prev,
        [selectedUser.id]: updatedUserRoles
      }));

      setShowRoleModal(false);
      setSelectedUser(null);
      setSelectedRoleId('');
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      await RBACService.removeRoleFromUser(userId, roleId);
      
      // Refresh user roles
      const updatedUserRoles = await RBACService.getUserRoles(userId);
      setUserRoles(prev => ({
        ...prev,
        [userId]: updatedUserRoles
      }));
    } catch (error) {
      console.error('Error removing role:', error);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ approved: true })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, approved: true } : user
      ));
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="User Management" breadcrumb={<span>Admin &gt; <span className="text-gray-900">User Management</span></span>}>
        <div className="p-6">
          <div className="text-center">Loading users...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Management" breadcrumb={<span>Admin &gt; <span className="text-gray-900">User Management</span></span>}>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
          </div>
          <PermissionGuard resource="users" action="create">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <FaUserPlus /> Add User
            </button>
          </PermissionGuard>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.contact_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.approved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {userRoles[user.id]?.map((userRole) => (
                          <span
                            key={userRole.id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                          >
                            {userRole.role_name}
                            <PermissionGuard resource="users" action="manage">
                              <button
                                onClick={() => handleRemoveRole(user.id, userRole.role_id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FaTrash className="w-3 h-3" />
                              </button>
                            </PermissionGuard>
                          </span>
                        ))}
                        {(!userRoles[user.id] || userRoles[user.id].length === 0) && (
                          <span className="text-xs text-gray-500">No roles assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <PermissionGuard resource="users" action="manage">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaShieldAlt />
                          </button>
                        </PermissionGuard>
                        
                        {!user.approved && (
                          <PermissionGuard resource="users" action="approve">
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                          </PermissionGuard>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Assignment Modal */}
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Assign Role to {selectedUser.first_name} {selectedUser.last_name}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Role
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} (Level {role.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedUser(null);
                    setSelectedRoleId('');
                  }}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignRole}
                  disabled={!selectedRoleId}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  Assign Role
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
