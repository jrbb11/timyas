import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { supabase } from '../../utils/supabaseClient';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase.from('app_users').select('*');
    if (error) setError(error.message);
    else setUsers(data || []);
    setLoading(false);
  }

  async function approveUser(userId: string) {
    setUpdating(userId);
    const { error } = await supabase.from('app_users').update({ approved: true }).eq('user_id', userId);
    if (error) setError(error.message);
    else await fetchUsers();
    setUpdating(null);
  }

  return (
    <AdminLayout title="User Approvals" breadcrumb={<span>Admin &gt; <span className="text-gray-900">User Approvals</span></span>}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">User Approvals</h2>
        {loading ? (
          <div>Loading users...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left">User ID</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Approved</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id} className="border-b">
                  <td className="p-4">{user.user_id}</td>
                  <td className="p-4">{user.email || user.username || '-'}</td>
                  <td className="p-4">{user.approved ? '✅' : '❌'}</td>
                  <td className="p-4">
                    {!user.approved && (
                      <button
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        onClick={() => approveUser(user.user_id)}
                        disabled={updating === user.user_id}
                      >
                        {updating === user.user_id ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
} 