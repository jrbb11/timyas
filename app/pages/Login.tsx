import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { FaBuilding, FaMicroscope, FaClipboardList } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }
    // Fetch user info and roles
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('User not found after login.');
      setLoading(false);
      return;
    }
    const { data: appUser } = await supabase
      .from('app_users')
      .select('id, first_name, last_name, email')
      .eq('user_id', user.id)
      .single();
    let welcomeName = appUser?.first_name || appUser?.email || 'User';
    // Fetch roles
    const { data: roles } = appUser ? await supabase
      .from('user_roles')
      .select('role')
      .eq('app_user_id', appUser.id) : { data: [] };
    const userRoles = roles ? roles.map(r => r.role) : [];
    // Show welcome message as toast
    toast.success(`Welcome back, ${welcomeName}! Your roles: ${userRoles.join(', ')}`);
    navigate('/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-400">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel */}
        <div className="hidden md:flex flex-col justify-center items-start bg-blue-700 text-white p-10 w-1/2 relative">
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-2">Welcome back to Timyas Lechon Manok</h2>
            <p className="text-blue-100">Modern franchisee & sales management for your business.</p>
          </div>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <span className="bg-blue-900 p-3 rounded-xl"><FaBuilding size={28} /></span>
              <div>
                <div className="font-semibold">Branch Management</div>
                <div className="text-blue-100 text-sm">Easily manage all your branches and franchisees in one place.</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="bg-blue-900 p-3 rounded-xl"><FaMicroscope size={28} /></span>
              <div>
                <div className="font-semibold">Sales Analytics</div>
                <div className="text-blue-100 text-sm">Track sales, payments, and dues with real-time dashboards.</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="bg-blue-900 p-3 rounded-xl"><FaClipboardList size={28} /></span>
              <div>
                <div className="font-semibold">Inventory & Finance</div>
                <div className="text-blue-100 text-sm">Stay on top of stock, expenses, and financials with ease.</div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-6 left-10 text-xs text-blue-200">&copy; {new Date().getFullYear()} Timyas Lechon Manok</div>
        </div>
        {/* Right Panel (Form) */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-16">
          <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-6">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Login to <span className="text-blue-700">Timyas Lechon Manok</span></h2>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                Remember me
              </label>
              <a href="#" className="text-blue-700 text-sm underline">Forgot Password?</a>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
