import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function ProtectedLayout() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthenticated(true);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return null;
  return authenticated ? <Outlet /> : null;
} 