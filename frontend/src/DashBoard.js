// src/Dashboard.js
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // refresh to return to Auth UI
  };

  if (!user) return <p>Loading user...</p>;

  return (
    <div>
      <h2>Welcome, {user.email}</h2>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Dashboard;
