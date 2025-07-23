import { useEffect } from 'react';
import { supabase } from './supabaseClient';

function Dashboard() {
  useEffect(() => {
    const sendTokenToBackend = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      if (accessToken) {
        await fetch('http://localhost:5000/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    };

    sendTokenToBackend();
  }, []);

  return <div>✅ Logged in! Dashboard content here.</div>;
}

export default Dashboard;
