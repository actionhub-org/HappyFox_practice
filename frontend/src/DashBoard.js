import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  CalendarIcon,
  LogoutIcon,
  MailIcon,
} from '@heroicons/react/solid';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

function StatusBadge({ status }) {
  const base = 'inline-flex items-center px-2 py-1 rounded text-xs font-semibold';
  const styles = {
    Approved: 'bg-green-100 text-green-800',
    Accepted: 'bg-green-100 text-green-800',
    Available: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    Booked: 'bg-red-100 text-red-800',
    Pending: 'bg-yellow-100 text-yellow-800',
  };
  const icons = {
    Approved: <CheckCircleIcon className="w-4 h-4 inline mr-1" />,
    Accepted: <CheckCircleIcon className="w-4 h-4 inline mr-1" />,
    Available: <CheckCircleIcon className="w-4 h-4 inline mr-1" />,
    Rejected: <XCircleIcon className="w-4 h-4 inline mr-1" />,
    Booked: <XCircleIcon className="w-4 h-4 inline mr-1" />,
    Pending: <ExclamationCircleIcon className="w-4 h-4 inline mr-1" />,
  };
  return (
    <span className={`${base} ${styles[status] || styles.Pending}`}>{icons[status] || icons.Pending}{status}</span>
  );
}

function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed top-6 right-6 z-50 animate-fade-in">
      <div className="flex items-center bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 hover:text-blue-200 text-lg">✕</button>
      </div>
    </div>
  );
}

function ApprovalChainModal({ open, onClose, approvers }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-blue-700 mb-2">Approval Chain</h2>
        <div className="flex flex-col gap-2 overflow-y-auto max-h-60 scroll-smooth">
          {approvers && approvers.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-semibold text-blue-900 text-sm">{a.role}:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.status === 'approved' ? 'bg-green-100 text-green-700' : a.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold self-end">Close</button>
      </div>
    </div>
  );
}

function QuickApplyModal({ open, onClose, user, session }) {
  const eventTypes = [
    'academic',
    'cultural',
    'tech',
    'sports',
    'social',
    'administrative',
    'other'
  ];
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState(eventTypes[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setResult(null);
      setError('');
      setLoading(false);
    }
  }, [open]);

  const handleQuickApply = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('http://localhost:5100/api/event/quick-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        setError('Could not parse response from backend.');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Failed to get suggestion');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Could not connect to suggestion service. Please try again later.');
    }
    setLoading(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm transition-all duration-300 animate-fade-in">
      <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-3xl shadow-2xl border border-blue-200 p-10 w-full max-w-lg flex flex-col gap-8 animate-fade-in">
        <h2 className="text-3xl font-extrabold text-blue-700 mb-2 text-center">Quick Apply</h2>
        <input
          type="text"
          className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-200 text-lg w-full bg-white/90 shadow"
          placeholder="Enter Event Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />
        <textarea
          className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-200 text-lg w-full bg-white/90 shadow"
          placeholder="Enter Event Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
        />
        <select
          className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-200 text-lg w-full bg-white/90 shadow"
          value={eventType}
          onChange={e => setEventType(e.target.value)}
        >
          {eventTypes.map(type => (
            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>
        {error && <div className="text-red-600 font-semibold text-center">{error}</div>}
        {result && (
          <div className="bg-blue-50/80 p-4 rounded-xl mt-2 overflow-y-auto max-h-[300px] scroll-smooth border border-blue-100 shadow-inner">
            <div className="font-semibold mb-2 text-blue-700">Suggested Data:</div>
            <div className="space-y-2">
              {result.suggested_start_date && (
                <div>
                  <span className="font-semibold">Suggested Start Date:</span>
                  <span className="ml-2 text-green-700">{result.suggested_start_date}</span>
                </div>
              )}
              {result.suggested_end_date && (
                <div>
                  <span className="font-semibold">Suggested End Date:</span>
                  <span className="ml-2 text-blue-700">{result.suggested_end_date}</span>
                </div>
              )}
              {result.venue_suggestions && result.venue_suggestions.suggested_venues && result.venue_suggestions.suggested_venues.length > 0 && (
                <div>
                  <span className="font-semibold">Suggested Venues:</span>
                  <ul className="list-disc ml-6 text-blue-900">
                    {result.venue_suggestions.suggested_venues.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                </div>
              )}
              {result.preferred_venue && (
                <div>
                  <span className="font-semibold">Preferred Venue:</span>
                  <span className="ml-2">{result.preferred_venue}</span>
                </div>
              )}
              {result.duration_days && (
                <div>
                  <span className="font-semibold">Duration (days):</span>
                  <span className="ml-2">{result.duration_days}</span>
                </div>
              )}
              {result.constraints && result.constraints.length > 0 && (
                <div>
                  <span className="font-semibold">Constraints:</span>
                  <ul className="list-disc ml-6">
                    {result.constraints.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
              {result.skipped_reasons && (
                <div>
                  <span className="font-semibold">Skipped Dates/Reasons:</span>
                  <ul className="list-disc ml-6 text-sm text-gray-600">
                    {result.skipped_reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
            {/* Only show the button if a valid date is found */}
            {result.suggested_start_date && result.suggested_start_date !== 'No suitable date found' && (
              <button
                className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-blue-500 hover:to-green-500 font-bold text-lg w-full shadow-lg transition"
                onClick={async () => {
                  // Book the event
                  const eventData = {
                    title: title.trim(),
                    description: description.trim(),
                    date: result.suggested_start_date || '',
                    venue: result.preferred_venue || 'Main Auditorium',
                    eventType,
                    organizer: session?.user?.email || user?.email || '',
                  };
                  try {
                    const res = await fetch('http://localhost:5100/api/event/book', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
                      body: JSON.stringify(eventData)
                    });
                    const data = await res.json();
                    if (data.success) {
                      alert('Event booked and sent for approval!');
                      onClose();
                    } else {
                      alert('Failed to book event: ' + (data.error || 'Unknown error'));
                    }
                  } catch (err) {
                    alert('Error booking event: ' + err.message);
                  }
                }}
              >Use This Suggestion</button>
            )}
          </div>
        )}
        <div className="flex gap-4 justify-end mt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold border border-gray-200 shadow"
            disabled={loading}
          >Cancel</button>
          {!result && (
            <button
              onClick={handleQuickApply}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:from-blue-700 hover:to-blue-500 font-semibold shadow transition"
              disabled={!title.trim() || !description.trim() || loading}
            >{loading ? 'Processing...' : 'Suggest Date'}</button>
          )}
        </div>
      </div>
    </div>
  );
}

function OrganizeEventForm({ user, session, onEventSubmitted }) {
  const eventTypes = [
    'academic',
    'cultural',
    'tech',
    'sports',
    'social',
    'administrative',
    'other'
  ];
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState(eventTypes[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('Main Auditorium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quickApplyOpen, setQuickApplyOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (!title.trim() || !description.trim() || !startDate || !endDate || !venue) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }
    if (endDate < startDate) {
      setError('End date cannot be before start date.');
      setLoading(false);
      return;
    }
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate,
        venue,
        eventType,
        organizer: session?.user?.email || user?.email || '',
      };
      const res = await fetch('http://localhost:5100/api/event/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify(eventData)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Event application submitted for approval!');
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setVenue('Main Auditorium');
        setEventType(eventTypes[0]);
        if (onEventSubmitted) onEventSubmitted();
      } else {
        setError('Failed to submit event: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Error submitting event: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <section className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-12 flex flex-col gap-10 border border-blue-200/40 h-full min-h-[420px] justify-center animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-6 mb-8">
        <UserGroupIcon className="w-10 h-10 text-blue-500/80" />
        <h3 className="text-4xl font-extrabold text-blue-700/90">Organize New Event</h3>
      </div>
      {/* Quick Apply Button */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setQuickApplyOpen(true)}
          className="px-8 py-4 bg-gradient-to-r from-pink-200 to-blue-200 text-blue-700 rounded-xl hover:scale-105 hover:from-blue-200 hover:to-pink-200 shadow-lg font-bold transition text-xl border border-blue-300/30"
        >
          Quick Apply (AI Suggestion)
        </button>
      </div>
      <QuickApplyModal
        open={quickApplyOpen}
        onClose={() => setQuickApplyOpen(false)}
        user={user}
        session={session}
      />
      <form onSubmit={handleSubmit} className="space-y-10 mt-8">
        <div>
          <label className="block text-2xl font-semibold mb-3 text-blue-900/80">Event Title</label>
          <input
            type="text"
            className="w-full border px-5 py-4 rounded-xl focus:ring-2 focus:ring-blue-200 text-xl bg-white/90 shadow"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-2xl font-semibold mb-3 text-blue-900/80">Event Dates</label>
          <div className="flex gap-6">
            <div className="flex-1">
              <label className="block text-lg mb-1 text-blue-800">From</label>
              <input
                type="date"
                className="w-full border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-200 text-lg bg-white/90 shadow"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-lg mb-1 text-blue-800">To</label>
              <input
                type="date"
                className="w-full border px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-200 text-lg bg-white/90 shadow"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-2xl font-semibold mb-3 text-blue-900/80">Description</label>
          <textarea
            className="w-full border px-5 py-4 rounded-xl focus:ring-2 focus:ring-blue-200 text-xl bg-white/90 shadow"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-2xl font-semibold mb-3 text-blue-900/80">Event Type</label>
          <select
            className="w-full border px-5 py-4 rounded-xl focus:ring-2 focus:ring-blue-200 text-xl bg-white/90 shadow"
            value={eventType}
            onChange={e => setEventType(e.target.value)}
            required
          >
            {eventTypes.map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-10">
          <div className="flex-1">
            <label className="block text-2xl font-semibold mb-3 text-blue-900/80">Venue</label>
            <select
              className="w-full border px-5 py-4 rounded-xl focus:ring-2 focus:ring-blue-200 text-xl bg-white/90 shadow"
              value={venue}
              onChange={e => setVenue(e.target.value)}
            >
              <option>Main Auditorium</option>
              <option>Seminar Hall</option>
              <option>Open Ground</option>
              <option>AV Hall</option>
            </select>
          </div>
        </div>
        {error && <div className="text-red-600 font-semibold">{error}</div>}
        {success && <div className="text-green-600 font-semibold">{success}</div>}
        <button type="submit" className="w-1/2 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:scale-105 hover:from-blue-500 hover:to-green-500 shadow-lg font-bold transition text-xl border border-white/30" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </section>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [approvalChainOpen, setApprovalChainOpen] = useState(false);
  const [selectedApprovers, setSelectedApprovers] = useState([]);
  const navigate = useNavigate();
  const [session, setSession] = useState(undefined); // undefined = loading, null = no session

  // Keep user and session in sync with Supabase auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Debug: log user and session state
  useEffect(() => {
    console.log('DEBUG: Current session:', session);
    console.log('DEBUG: Current user:', user);
  }, [session, user]);

  useEffect(() => {
    if (user && user.email && session) {
      fetch(`http://localhost:5100/api/event/for-organizer?email=${encodeURIComponent(user.email)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
        .then(res => res.json())
        .then(data => setOrganizerEvents(data.events || []));
    }
  }, [user, session]);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
          <span className="text-xl text-blue-900 font-semibold">Loading your session...</span>
        </div>
      </div>
    );
  }

  function getEventStatus(event) {
    if (event.approvers.some(a => a.status === 'rejected')) return 'Rejected';
    if (event.approvers.every(a => a.status === 'approved')) return 'Approved';
    return 'Pending';
  }

  const pendingEvents = organizerEvents.filter(event => getEventStatus(event) !== 'Approved' && getEventStatus(event) !== 'Rejected');
  const approvedEvents = organizerEvents.filter(event => getEventStatus(event) === 'Approved');
  const rejectedEvents = organizerEvents.filter(event => getEventStatus(event) === 'Rejected');

  // Helper to refresh events after submission
  const refreshEvents = () => {
    if (user && user.email && session) {
      fetch(`http://localhost:5100/api/event/for-organizer?email=${encodeURIComponent(user.email)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
        .then(res => res.json())
        .then(data => setOrganizerEvents(data.events || []));
    }
  };

  // Professional logout handler
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setToastMsg('Logged out successfully.');
      navigate('/');
    } catch (err) {
      setToastMsg('Logout failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex flex-col font-sans">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      <ApprovalChainModal open={approvalChainOpen} onClose={() => setApprovalChainOpen(false)} approvers={selectedApprovers} />
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-blue-900 to-blue-700 py-8 px-0 flex flex-col md:flex-row items-center justify-between gap-8 shadow-lg rounded-b-3xl mb-8">
        <div className="flex items-center gap-8">
          <CalendarIcon className="w-20 h-20 text-white/80 drop-shadow-xl" />
          <div>
            <h1 className="text-6xl font-extrabold mb-2 tracking-tight drop-shadow">Organizer Dashboard</h1>
            <p className="text-2xl font-medium text-blue-100/90">Plan and manage campus events with ease</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {user && (
            <div className="flex items-center gap-4 bg-white/30 px-6 py-3 rounded-2xl backdrop-blur-md shadow-lg">
              <span className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-200 text-blue-800 font-bold text-3xl shadow-md">
                {user.email?.[0].toUpperCase() || 'U'}
              </span>
              <span className="truncate max-w-[240px] font-semibold text-xl text-white/90">{user.email}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-500 to-blue-600 text-white rounded-2xl shadow-lg hover:scale-105 hover:from-blue-600 hover:to-pink-500 transition font-bold text-xl backdrop-blur-md border border-white/30"
            title="Logout"
          >
            <LogoutIcon className="w-7 h-7" /> Logout
          </button>
        </div>
      </header>
      {/* Navbar Links */}
      <nav className="w-full max-w-7xl mx-auto flex gap-6 mb-8 border-b border-blue-200 px-4">
        <Link to="/dashboard/organize" className="px-6 py-3 text-lg font-bold rounded-t-lg focus:outline-none transition text-purple-700 hover:bg-purple-100">Organize Event</Link>
        <Link to="/dashboard/applications" className="px-6 py-3 text-lg font-bold rounded-t-lg focus:outline-none transition text-blue-700 hover:bg-blue-100">Your Event Applications</Link>
        <Link to="/dashboard/approved" className="px-6 py-3 text-lg font-bold rounded-t-lg focus:outline-none transition text-green-700 hover:bg-green-100">Approved Events</Link>
        <Link to="/dashboard/rejected" className="px-6 py-3 text-lg font-bold rounded-t-lg focus:outline-none transition text-red-700 hover:bg-red-100">Rejected Events</Link>
        <Link to="/dashboard/calendar" className="px-6 py-3 text-lg font-bold rounded-t-lg focus:outline-none transition text-cyan-700 hover:bg-cyan-100">Calendar</Link>
        <Link to="/dashboard/resources" className="px-6 py-3 text-lg font-bold rounded-t-lg focus:outline-none transition text-amber-700 hover:bg-amber-100">Resource Recommendation</Link>
        <Link to="/dashboard/reports" className="px-6 py-3 text-lg font-bold rounded-t-lg focus:outline-none transition text-pink-700 hover:bg-pink-100">Reports</Link>
      </nav>
      <main className="flex-1 w-full flex flex-col items-center justify-start py-10 px-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 min-h-screen">
        <div className="w-full max-w-7xl mx-auto">
          <Routes>
            <Route path="/organize" element={<OrganizeEventForm user={user} session={session} onEventSubmitted={refreshEvents} />} />
            <Route path="/applications" element={
              <section className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-12 flex flex-col gap-10 border border-blue-200/40 h-full min-h-[320px] justify-center animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-blue-700 border-b border-blue-200 pb-2">Your Event Applications</h2>
                {pendingEvents.length > 0 ? (
                  <div className="overflow-y-auto max-h-[400px] scroll-smooth">
                    <table className="w-full text-left border-separate border-spacing-y-2 mb-8">
                      <thead>
                        <tr className="text-lg text-blue-900/80">
                          <th className="px-4 py-2">Title</th>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Venue</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2">Approval Chain</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingEvents.map(event => (
                          <tr key={event._id} className="bg-white/80 rounded-xl shadow hover:bg-blue-50 transition">
                            <td className="py-3 px-4 font-semibold text-blue-800">{event.title}</td>
                            <td className="py-3 px-4">{event.date}</td>
                            <td className="py-3 px-4">{event.venue}</td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full font-bold ${getEventStatus(event) === 'Approved' ? 'bg-green-100 text-green-700' : getEventStatus(event) === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{getEventStatus(event)}</span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
                                onClick={() => { setSelectedApprovers(event.approvers || []); setApprovalChainOpen(true); }}
                              >View Chain</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="text-2xl font-semibold text-blue-500 mb-2">No events registered yet</div>
                    <div className="text-gray-500 text-lg">Your event applications and their approval status will appear here.</div>
                  </div>
                )}
              </section>
            } />
            <Route path="/approved" element={
              <section className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-12 flex flex-col gap-10 border border-green-200/40 h-full min-h-[320px] justify-center animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-green-700 border-b border-green-200 pb-2">Approved Events</h2>
                {approvedEvents.length > 0 ? (
                  <div className="overflow-y-auto max-h-[400px] scroll-smooth">
                    <table className="w-full text-left border-separate border-spacing-y-2 mb-8">
                      <thead>
                        <tr className="text-lg text-green-900/80">
                          <th className="px-4 py-2">Title</th>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Venue</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2">Approval Chain</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedEvents.map(event => (
                          <tr key={event._id} className="bg-white/80 rounded-xl shadow hover:bg-green-50 transition">
                            <td className="py-3 px-4 font-semibold text-green-800">{event.title}</td>
                            <td className="py-3 px-4">{event.date}</td>
                            <td className="py-3 px-4">{event.venue}</td>
                            <td className="py-3 px-4">
                              <span className="px-3 py-1 rounded-full font-bold bg-green-100 text-green-700">Approved</span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
                                onClick={() => { setSelectedApprovers(event.approvers || []); setApprovalChainOpen(true); }}
                              >View Chain</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="text-2xl font-semibold text-green-500 mb-2">No approved events yet</div>
                    <div className="text-gray-500 text-lg">Your approved events will appear here.</div>
                  </div>
                )}
              </section>
            } />
            <Route path="/rejected" element={
              <section className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-12 flex flex-col gap-10 border border-red-200/40 h-full min-h-[320px] justify-center animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-red-700 border-b border-red-200 pb-2">Rejected Events</h2>
                {rejectedEvents.length > 0 ? (
                  <div className="overflow-y-auto max-h-[400px] scroll-smooth">
                    <table className="w-full text-left border-separate border-spacing-y-2 mb-8">
                      <thead>
                        <tr className="text-lg text-red-900/80">
                          <th className="px-4 py-2">Title</th>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Venue</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2">Approval Chain</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rejectedEvents.map(event => (
                          <tr key={event._id} className="bg-white/80 rounded-xl shadow hover:bg-red-50 transition">
                            <td className="py-3 px-4 font-semibold text-red-800">{event.title}</td>
                            <td className="py-3 px-4">{event.date}</td>
                            <td className="py-3 px-4">{event.venue}</td>
                            <td className="py-3 px-4">
                              <span className="px-3 py-1 rounded-full font-bold bg-red-100 text-red-700">Rejected</span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
                                onClick={() => { setSelectedApprovers(event.approvers || []); setApprovalChainOpen(true); }}
                              >View Chain</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="text-2xl font-semibold text-red-500 mb-2">No rejected events yet</div>
                    <div className="text-gray-500 text-lg">Your rejected events will appear here.</div>
                  </div>
                )}
              </section>
            } />
            <Route path="/calendar" element={
              <section className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 flex flex-col gap-10 border border-cyan-200/40 h-full min-h-[520px] justify-center animate-fade-in">
                <h2 className="text-3xl font-extrabold mb-6 text-cyan-700 text-center tracking-tight">Event Calendar</h2>
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  height="auto"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: ''
                  }}
                  events={organizerEvents.map(event => ({
                    title: event.title,
                    start: event.date,
                    color: getEventStatus(event) === 'Approved' ? '#22c55e' : getEventStatus(event) === 'Rejected' ? '#ef4444' : '#facc15',
                    borderColor: getEventStatus(event) === 'Approved' ? '#16a34a' : getEventStatus(event) === 'Rejected' ? '#b91c1c' : '#ca8a04',
                    textColor: '#1e293b',
                    extendedProps: { ...event }
                  }))}
                  eventClick={info => {
                    setSelectedApprovers(info.event.extendedProps.approvers || []);
                    setApprovalChainOpen(true);
                  }}
                  dayMaxEventRows={3}
                  eventDisplay="block"
                  eventBorderColor="#e0e7ef"
                  eventBackgroundColor="#f1f5f9"
                  eventContent={renderEventContent}
                  className="rounded-2xl shadow-xl border border-cyan-100"
                />
                <div className="flex gap-6 justify-center mt-8">
                  <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#22c55e] border border-[#16a34a]"></span> Approved</span>
                  <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#facc15] border border-[#ca8a04]"></span> Pending</span>
                  <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#ef4444] border border-[#b91c1c]"></span> Rejected</span>
                </div>
              </section>
            } />
            <Route path="/resources" element={<ResourceRecommendationPage user={user} organizerEvents={organizerEvents} refreshEvents={refreshEvents} />} />
            <Route path="*" element={<Navigate to="/dashboard/applications" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function Loader() {
  return (
    <svg className="animate-spin h-5 w-5 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>
  );
}

function MailStatusContainer({ mailStatus, onClose }) {
  if (!mailStatus || mailStatus.length === 0) return null;
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md animate-fade-in">
      <div className="bg-white border border-blue-200 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-2">
          <MailIcon className="w-7 h-7 text-blue-500" />
          <span className="text-xl font-bold text-blue-700">Resource Email Status</span>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-blue-500 text-2xl">×</button>
        </div>
        <ul className="space-y-2">
          {mailStatus.map((m, i) => (
            <li key={i} className="flex items-center gap-3">
              {m.status === 'success' ? (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-500" />
              )}
              <span className="font-semibold capitalize">{m.resource.replace(/_/g, ' ')}</span>
              <span className="text-gray-700">→</span>
              <span className="text-blue-700 font-mono">{m.to}</span>
              {m.status === 'error' && (
                <span className="ml-2 text-xs text-red-500">{m.error}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ResourceRecommendationPage({ user, organizerEvents, refreshEvents }) {
  const [resourceDocs, setResourceDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState({}); // event_id -> { ...edited resources }
  const [mailStatus, setMailStatus] = useState([]);
  const [sending, setSending] = useState({}); // event_id -> boolean
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  useEffect(() => {
    async function fetchResources() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('http://localhost:5100/api/event/resource/for-organizer?email=' + encodeURIComponent(user?.email || ''), {
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {}
        });
        const data = await res.json();
        setResourceDocs(data.resources || []);
      } catch (err) {
        setError('Failed to fetch resource recommendations.');
      }
      setLoading(false);
    }
    if (user && user.email && session) fetchResources();
  }, [user, session, success]);

  const handleEditChange = (event_id, key, value) => {
    setEditing(prev => ({ ...prev, [event_id]: { ...prev[event_id], [key]: value } }));
  };

  const handleConfirm = async (event_id, original, edited) => {
    setError(''); setSuccess(''); setMailStatus([]);
    setSending(prev => ({ ...prev, [event_id]: true }));
    try {
      const res = await fetch('http://localhost:5100/api/event/resource/confirm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({
          event_id,
          edited_resources: edited,
          confirmed_by: user.email
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Resource allocation confirmed!');
        setEditing(prev => ({ ...prev, [event_id]: undefined }));
        setMailStatus(data.mailStatus || []);
        refreshEvents && refreshEvents();
      } else {
        setError(data.error || 'Failed to confirm resource allocation.');
        setMailStatus(data.mailStatus || []);
      }
    } catch (err) {
      setError('Failed to confirm resource allocation.');
    }
    setSending(prev => ({ ...prev, [event_id]: false }));
  };

  return (
    <section className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 flex flex-col gap-10 border border-amber-200/40 h-full min-h-[520px] justify-center animate-fade-in">
      <MailStatusContainer mailStatus={mailStatus} onClose={() => setMailStatus([])} />
      <h2 className="text-3xl font-extrabold mb-6 text-amber-700 text-center tracking-tight">Resource Recommendation</h2>
      {loading ? (
        <div className="text-xl text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-xl text-center text-red-500">{error}</div>
      ) : resourceDocs.length === 0 ? (
        <div className="text-xl text-center text-gray-500">No resource recommendations yet.</div>
      ) : (
        <div className="flex flex-col gap-10">
          {resourceDocs.map(doc => {
            const event = organizerEvents.find(e => e._id === doc.event_id);
            const isPending = doc.status === 'pending';
            const resources = isPending ? doc.recommended_resources : (doc.edited_resources || doc.recommended_resources);
            return (
              <div key={doc.event_id} className="bg-white/95 rounded-2xl shadow-lg border border-amber-100 p-8 flex flex-col gap-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-xl font-bold text-amber-700">{event?.title || 'Event'}</span>
                  <span className="text-base text-gray-500">({event?.date})</span>
                  <span className={`ml-auto px-4 py-1 rounded-full text-sm font-bold ${isPending ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{isPending ? 'Pending Confirmation' : 'Confirmed'}</span>
                </div>
                <div className="flex flex-col gap-4">
                  {Object.entries(resources).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-4">
                      <label className="w-48 font-semibold text-gray-700 capitalize">{key.replace(/_/g, ' ')}</label>
                      {isPending ? (
                        typeof value === 'boolean' ? (
                          <input type="checkbox" checked={editing[doc.event_id]?.[key] !== undefined ? editing[doc.event_id][key] : value} onChange={e => handleEditChange(doc.event_id, key, e.target.checked)} />
                        ) : (
                          <input type="number" className="border px-3 py-2 rounded-lg w-32" value={editing[doc.event_id]?.[key] !== undefined ? editing[doc.event_id][key] : value} min={0} onChange={e => handleEditChange(doc.event_id, key, Number(e.target.value))} />
                        )
                      ) : (
                        <span className="text-lg font-mono">{String(value)}</span>
                      )}
                    </div>
                  ))}
                </div>
                {isPending && (
                  <button
                    className={`mt-4 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 text-white font-bold text-lg shadow-lg hover:from-amber-700 hover:to-amber-500 transition flex items-center justify-center ${sending[doc.event_id] ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() => handleConfirm(doc.event_id, doc.recommended_resources, { ...doc.recommended_resources, ...editing[doc.event_id] })}
                    disabled={sending[doc.event_id]}
                  >
                    {sending[doc.event_id] && <Loader />}
                    {sending[doc.event_id] ? 'Sending...' : 'Confirm Allocation'}
                  </button>
                )}
                {!isPending && (
                  <>
                    <div className="text-green-700 font-semibold text-center mt-2">Resource allocation confirmed!</div>
                    <div className="flex justify-center mt-4">
                      <Link
                        to={`/dashboard/report/${doc.event_id}`}
                        className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-800 transition"
                      >
                        Generate Report
                      </Link>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      {success && <div className="text-green-600 font-semibold text-center mt-6">{success}</div>}
    </section>
  );
}

// Helper for custom event rendering (optional, for aesthetics)
function renderEventContent(eventInfo) {
  return (
    <div className="flex flex-col items-start">
      <span className="font-bold text-base truncate">{eventInfo.event.title}</span>
      <span className="text-xs text-slate-500">{eventInfo.timeText}</span>
    </div>
  );
}
