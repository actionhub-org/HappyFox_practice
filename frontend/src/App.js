// src/App.js
import { useEffect, useState } from 'react';
import { CalendarIcon, CheckCircleIcon, LightningBoltIcon, UserGroupIcon, MailIcon } from '@heroicons/react/solid';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './supabaseClient';
import Dashboard from './DashBoard';
import ApproverDashboard from './ApproverDashboard';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import React from 'react';
import ReportPage from './ReportPage';
import ReportsListPage from './ReportsListPage';
import StudentDashboard from './StudentDashboard';

// Add a SwitchRoleButton component
function SwitchRoleButton() {
  const handleSwitchRole = () => {
    localStorage.removeItem('userRole');
    window.location.reload();
  };
  return (
    <button
      onClick={handleSwitchRole}
      className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full bg-yellow-500 text-white font-bold shadow-lg hover:bg-yellow-600 transition"
      title="Switch Role"
    >
      Switch Role
    </button>
  );
}

function PassKeyModal({ open, onSubmit, error, loading }) {
  const [passKey, setPassKey] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-blue-700 mb-2">Enter Access Key</h2>
        <input
          type="password"
          className="border px-4 py-2 rounded-lg text-lg"
          placeholder="Enter organizer key"
          value={passKey}
          onChange={e => setPassKey(e.target.value)}
          autoFocus
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-800 transition"
          onClick={() => onSubmit(passKey)}
          disabled={loading}
        >
          {loading ? 'Validating...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

function EmailVerificationModal({ open, onResend, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in flex flex-col gap-4 items-center">
        <h2 className="text-2xl font-bold text-blue-700 mb-2">Verify Your Email</h2>
        <p className="text-gray-700 text-center mb-2">Please verify your email address to access the dashboard. Check your inbox for a verification link.</p>
        <button
          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-800 transition"
          onClick={onResend}
          disabled={loading}
        >
          {loading ? 'Resending...' : 'Resend Verification Email'}
        </button>
      </div>
    </div>
  );
}

function RoleSelectModal({ open, onSelect }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in flex flex-col gap-6 items-center">
        <h2 className="text-2xl font-bold text-blue-700 mb-2">Who are you?</h2>
        <button
          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-800 transition w-full"
          onClick={() => onSelect('student')}
        >
          Student
        </button>
        <button
          className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold shadow hover:bg-green-800 transition w-full"
          onClick={() => onSelect('organizer')}
        >
          Organizer
        </button>
      </div>
    </div>
  );
}

function LandingPage({ session, onLogin }) {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = React.useState(false);
  const [authView, setAuthView] = useState('sign_in'); // 'sign_in' or 'sign_up'
  // Remove all role/passkey modal state from LandingPage
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [pendingRole, setPendingRole] = useState(null); // 'student' or 'organizer'

  // Check if user exists in backend after login
  useEffect(() => {
    if (session) {
      // Check if user is verified
      const isVerified = session.user.email_confirmed_at || session.user.confirmed_at;
      if (!isVerified) {
        setShowVerifyModal(true);
        return;
      } else {
        setShowVerifyModal(false);
      }
      // Always show role select modal after login
      // setPendingUser({ email: session.user.email, access_token: session.access_token }); // Removed
      // setShowRoleSelect(true); // Removed
    }
  }, [session, navigate]);

  // Handle role selection
  const handleRoleSelect = (role) => {
    setPendingRole(role);
    // setShowRoleSelect(false); // Removed
    if (role === 'organizer') {
      // setShowPassKey(true); // Removed
    } else if (role === 'student') {
      // Set userType to student in backend
      fetch('http://localhost:5100/api/user/set-role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email, userType: 'student' })
      }).then(() => {
        // setShowPassKey(false); // Removed
        // setPendingUser(null); // Removed
        setPendingRole(null);
        navigate('/student-dashboard', { replace: true });
      });
    }
  };

  // Handle pass key submission
  const handlePassKeySubmit = async (passKey) => {
    // setPassKeyLoading(true); // Removed
    // setPassKeyError(''); // Removed
    // Example: hardcoded keys (replace with env/config in production)
    const ORGANIZER_KEY = 'organizer2024';
    const APPROVER_KEY = 'approver2024';
    let userType = null;
    if (passKey === ORGANIZER_KEY) userType = 'organizer';
    else if (passKey === APPROVER_KEY) userType = 'approver';
    if (!userType) {
      // setPassKeyError('Invalid access key.'); // Removed
      // setPassKeyLoading(false); // Removed
      return;
    }
    // Set userType in backend
    try {
      await fetch('http://localhost:5100/api/user/set-role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email, userType })
      });
      // setShowPassKey(false); // Removed
      // setPendingUser(null); // Removed
      setPendingRole(null);
      if (userType === 'approver') navigate('/approver', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      // setPassKeyError('Failed to set user role.'); // Removed
    }
    // setPassKeyLoading(false); // Removed
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    setVerifyLoading(true);
    await supabase.auth.resend({ type: 'signup', email: session.user.email });
    setVerifyLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full font-sans animate-fade-in">
      {/* Animated, attractive background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 animate-gradient-move" style={{ backgroundSize: '200% 200%' }} />
      {/* Main content, blurred and faded when login is active */}
      <div className={`relative z-10 flex flex-col items-center justify-center min-h-screen transition-all duration-300 ${showAuth ? 'blur-lg brightness-50 pointer-events-none select-none' : ''}`}>
        <header className="w-full max-w-4xl mx-auto flex flex-col items-center gap-4 py-12">
          <h1 className="text-6xl font-extrabold text-blue-900 drop-shadow mb-2 text-center">CampusSense</h1>
          <p className="text-2xl text-blue-700/80 font-medium text-center mb-6">AI-powered, seamless event management for universities</p>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => { setShowAuth(true); setAuthView('sign_up'); }}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-blue-400 text-white text-2xl font-bold shadow-lg hover:scale-105 hover:from-blue-400 hover:to-green-500 transition"
            >Sign Up</button>
            <button
              onClick={() => { setShowAuth(true); setAuthView('sign_in'); }}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-pink-500 text-white text-2xl font-bold shadow-lg hover:scale-105 hover:from-pink-500 hover:to-blue-600 transition"
            >Login</button>
          </div>
        </header>
        <main className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 mt-8 mb-16">
          <div className="bg-white/90 rounded-3xl shadow-xl p-8 flex flex-col gap-4 border-t-4 border-blue-400">
            <div className="flex items-center gap-3 mb-2">
              <LightningBoltIcon className="w-8 h-8 text-pink-500" />
              <span className="text-xl font-bold text-blue-700">Quick Apply (AI Suggestion)</span>
            </div>
            <p className="text-blue-900/80 text-lg">Describe your event in plain English and let our AI suggest the best dates and venues, considering holidays, exams, and availability.</p>
          </div>
          <div className="bg-white/90 rounded-3xl shadow-xl p-8 flex flex-col gap-4 border-t-4 border-purple-400">
            <div className="flex items-center gap-3 mb-2">
              <UserGroupIcon className="w-8 h-8 text-purple-500" />
              <span className="text-xl font-bold text-blue-700">Multi-level Approval Workflow</span>
            </div>
            <p className="text-blue-900/80 text-lg">Automatic routing to the right approvers based on event type. Transparent approval chain and real-time status updates.</p>
          </div>
          <div className="bg-white/90 rounded-3xl shadow-xl p-8 flex flex-col gap-4 border-t-4 border-green-400">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
              <span className="text-xl font-bold text-blue-700">Smart Resource Recommendation</span>
            </div>
            <p className="text-blue-900/80 text-lg">AI recommends resources (AV, staff, etc.) after approval. Organizers can review, edit, and confirm allocations.</p>
          </div>
          <div className="bg-white/90 rounded-3xl shadow-xl p-8 flex flex-col gap-4 border-t-4 border-cyan-400">
            <div className="flex items-center gap-3 mb-2">
              <CalendarIcon className="w-8 h-8 text-cyan-500" />
              <span className="text-xl font-bold text-blue-700">Unified Calendar</span>
            </div>
            <p className="text-blue-900/80 text-lg">Visualize all events in a beautiful calendar. See pending, approved, and rejected events at a glance.</p>
          </div>
          <div className="bg-white/90 rounded-3xl shadow-xl p-8 flex flex-col gap-4 border-t-4 border-amber-400 md:col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <MailIcon className="w-8 h-8 text-amber-500" />
              <span className="text-xl font-bold text-blue-700">Automated Notifications</span>
            </div>
            <p className="text-blue-900/80 text-lg">Get notified via email when resources are confirmed. Resource-specific emails ensure everyone is in the loop.</p>
          </div>
        </main>
        <footer className="w-full text-center text-blue-900/60 py-8 text-lg font-medium">&copy; {new Date().getFullYear()} Campus Event Automation. All rights reserved.</footer>
      </div>
      {/* Login modal, focused and above everything */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-blue-600"
              title="Close"
            >×</button>
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#2563eb',
                      brandAccent: '#1e40af',
                    },
                  },
                },
              }}
              providers={['google', 'github']}
              showLinks={true}
              view={authView}
              redirectTo={window.location.origin + '/dashboard'}
              theme="default"
              onlyThirdPartyProviders={false}
              magicLink={true}
              onViewChange={onLogin}
            />
          </div>
        </div>
      )}
      {/* Remove all role/passkey/verify modals from LandingPage */}
    </div>
  );
}

function AppWithRoleLogic() {
  const [session, setSession] = useState(null);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [pendingUser, setPendingUser] = useState(null); // { email, access_token }
  const [pendingRole, setPendingRole] = useState(null); // 'student' or 'organizer'
  const [showPassKey, setShowPassKey] = useState(false);
  const [passKeyError, setPassKeyError] = useState('');
  const [passKeyLoading, setPassKeyLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
    return () => subscription.unsubscribe();
  }, []);

  // Only show role select modal if no role is stored
  useEffect(() => {
    if (session) {
      // Check if user is verified
      const isVerified = session.user.email_confirmed_at || session.user.confirmed_at;
      if (!isVerified) {
        setShowVerifyModal(true);
        return;
      } else {
        setShowVerifyModal(false);
      }
      // Check if user is approver
      fetch(`http://localhost:5100/api/event/is-approver?email=${encodeURIComponent(session.user.email)}`)
        .then(res => res.json())
        .then(result => {
          if (result.isApprover === true || result.isApprover === 'true') {
            localStorage.setItem('userRole', 'approver');
            setShowRoleSelect(false);
            navigate('/approver', { replace: true });
          } else {
            // Only show role select if userRole is not set
            const storedRole = localStorage.getItem('userRole');
            if (!storedRole) {
              setPendingUser({ email: session.user.email, access_token: session.access_token });
              setShowRoleSelect(true);
              localStorage.removeItem('userRole');
            } else {
              setShowRoleSelect(false);
            }
          }
        });
    }
  }, [session]);

  // Handle role selection
  const handleRoleSelect = (role) => {
    setPendingRole(role);
    setShowRoleSelect(false);
    localStorage.setItem('userRole', role);
    if (role === 'organizer') {
      setShowPassKey(true);
    } else if (role === 'student') {
      // Set userType to student in backend
      fetch('http://localhost:5100/api/user/set-role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingUser.email, userType: 'student' })
      }).then(() => {
        setShowPassKey(false);
        setPendingUser(null);
        setPendingRole(null);
        navigate('/student-dashboard', { replace: true });
      });
    }
  };

  // Handle pass key submission
  const handlePassKeySubmit = async (passKey) => {
    setPassKeyLoading(true);
    setPassKeyError('');
    // Example: hardcoded keys (replace with env/config in production)
    const ORGANIZER_KEY = 'organizer2024';
    const APPROVER_KEY = 'approver2024';
    let userType = null;
    if (passKey === ORGANIZER_KEY) userType = 'organizer';
    else if (passKey === APPROVER_KEY) userType = 'approver';
    if (!userType) {
      setPassKeyError('Invalid access key.');
      setPassKeyLoading(false);
      return;
    }
    // Set userType in backend
    try {
      await fetch('http://localhost:5100/api/user/set-role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingUser.email, userType })
      });
      setShowPassKey(false);
      setPendingUser(null);
      setPendingRole(null);
      if (userType === 'approver') navigate('/approver', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      setPassKeyError('Failed to set user role.');
    }
    setPassKeyLoading(false);
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    setVerifyLoading(true);
    await supabase.auth.resend({ type: 'signup', email: session.user.email });
    setVerifyLoading(false);
  };

  // Block all routes except landing and auth modals until role is chosen
  // Only show modals if not on landing page
  const isLanding = location.pathname === '/';
  const blockApp = (!isLanding && (showRoleSelect || showPassKey || showVerifyModal));

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<LandingPage session={session} onLogin={() => {}} />} />
        {!blockApp && <Route path="/dashboard/*" element={<><Dashboard /><SwitchRoleButton /></>} />}
        {!blockApp && <Route path="/dashboard/report/:id" element={<ReportPage />} />}
        {!blockApp && <Route path="/dashboard/reports" element={<ReportsListPage />} />}
        {!blockApp && <Route path="/approver" element={<ApproverDashboard />} />}
        {!blockApp && <Route path="/student-dashboard" element={<><StudentDashboard /><SwitchRoleButton /></>} />}
        {!blockApp && <Route path="*" element={<Navigate to="/" replace />} />}
      </Routes>
      {/* Role Select Modal */}
      {!isLanding && <RoleSelectModal open={showRoleSelect} onSelect={handleRoleSelect} />}
      {/* Pass Key Modal for new users */}
      {!isLanding && <PassKeyModal open={showPassKey} onSubmit={handlePassKeySubmit} error={passKeyError} loading={passKeyLoading} />}
      {/* Email Verification Modal for unverified users */}
      {!isLanding && <EmailVerificationModal open={showVerifyModal} onResend={handleResendVerification} loading={verifyLoading} />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppWithRoleLogic />
    </Router>
  );
}

export default App;
