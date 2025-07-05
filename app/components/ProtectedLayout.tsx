import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getAppUser } from '../utils/supabaseClient';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkApproval() {
      const user = await getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }
      const { data: appUser } = await getAppUser(user.id);
      if (!appUser?.approved) {
        navigate('/not-approved');
        return;
      }
      setApproved(true);
      setLoading(false);
    }
    checkApproval();
  }, [navigate]);

  if (loading) return <div>Loading...</div>;
  if (!approved) return null;

  return <>{children}</>;
} 