// src/App.js
import { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './supabaseClient';
import Dashboard from './DashBoard'; // ⬅️ import your protected component

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup on unmount
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div style={{ width: '400px', margin: 'auto', padding: '2rem' }}>
      {!session ? (
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']} // Optional
        />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

export default App;
