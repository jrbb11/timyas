import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { FaBuilding, FaMicroscope, FaClipboardList } from 'react-icons/fa';

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    contact_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('You must agree to the Terms and Privacy Policy.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);

    // 1. Register with Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message || 'Registration failed');
      setLoading(false);
      return;
    }

    // 2. Create app_users row
    const { error: appUserError } = await supabase.from('app_users').insert([{
      user_id: data.user.id,
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      contact_number: form.contact_number,
    }]);

    if (appUserError) {
      setError(appUserError.message);
      setLoading(false);
      return;
    }

    // 3. Assign default role (staff)
    // Get the app_user id
    const { data: appUser } = await supabase
      .from('app_users')
      .select('id')
      .eq('user_id', data.user.id)
      .single();

    if (appUser) {
      await supabase.from('user_roles').insert([{
        app_user_id: appUser.id,
        role: 'staff',
      }]);
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-400">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel */}
        <div className="hidden md:flex flex-col justify-center items-start bg-blue-700 text-white p-10 w-1/2 relative">
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-2">Welcome to Timyas Lechon Manok</h2>
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
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Sign up as <span className="text-blue-700">Timyas Lechon Manok</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input name="first_name" placeholder="Enter your first name" value={form.first_name} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input name="last_name" placeholder="Enter your last name" value={form.last_name} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-300" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input name="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input name="password" type="password" placeholder="Enter your password" value={form.password} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Number</label>
              <input name="contact_number" placeholder="Enter your contact number" value={form.contact_number} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-300" />
            </div>
            <div className="flex items-center gap-2">
              <input id="terms" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
              <label htmlFor="terms" className="text-sm text-gray-700">I agree with all <a href="#" className="text-blue-700 underline">Terms and Conditions</a> and <a href="#" className="text-blue-700 underline">Privacy Policy</a>.</label>
            </div>
            <button type="submit" disabled={loading || !agreed} className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition">
              {loading ? 'Registering...' : 'Sign Up'}
            </button>
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            {success && <div className="text-green-600 text-sm mt-2">Registration successful! Please check your email to verify your account.</div>}
          </form>
        </div>
      </div>
    </div>
  );
} 