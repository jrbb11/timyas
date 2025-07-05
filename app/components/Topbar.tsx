import { useEffect, useState } from 'react';
import { FaCalendarAlt, FaPlus } from 'react-icons/fa';
import { getCurrentUser, getAppUser } from '../utils/supabaseClient';

interface TopbarProps {
  title: string;
  breadcrumb?: React.ReactNode;
}

export const Topbar = ({ title, breadcrumb }: TopbarProps) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const authUser = await getCurrentUser();
      if (authUser) {
        const { data: appUser } = await getAppUser(authUser.id);
        setUser(appUser);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  return (
    <header className="flex items-center justify-between bg-white px-6 py-4 shadow border-b">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {breadcrumb && <div className="text-sm text-gray-400 mt-1">{breadcrumb}</div>}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
          {user?.name ? user.name[0].toUpperCase() : <FaCalendarAlt />}
        </div>
        <span className="font-medium text-sm text-gray-700">
          {loading ? 'Loading...' : user?.name || user?.email || 'User'}
        </span>
      </div>
    </header>
  );
};