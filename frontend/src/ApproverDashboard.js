import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, CalendarIcon, LogoutIcon } from '@heroicons/react/solid';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function getDaysLeft(dateStr) {
  const today = new Date();
  const eventDate = new Date(dateStr);
  today.setHours(0,0,0,0);
  eventDate.setHours(0,0,0,0);
  const diff = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return diff + ' days';
}

export default function ApproverDashboard() {
  const [events, setEvents] = useState([]);
  const [actionStatus, setActionStatus] = useState({});
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('pending'); // 'pending' or 'approved'
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (user && user.email) {
      fetch(`http://localhost:5100/api/event/for-approver?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => setEvents(data.events || []));
    }
  }, [user]);

  const handleAction = async (id, action) => {
    setActionStatus((prev) => ({ ...prev, [id]: action }));
    if (!user || !user.email) return;
    await fetch('http://localhost:5100/api/event/approve', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: id,
        approverEmail: user.email.toLowerCase(),
        status: action
      })
    });
    // Refetch events to update UI
    fetch(`http://localhost:5100/api/event/for-approver?email=${encodeURIComponent(user.email)}`)
      .then(res => res.json())
      .then(data => setEvents(data.events || []));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Filter events for current approver
  const getApproverStatus = (event) => {
    const approver = event.approvers.find(a => a.email.toLowerCase() === (user?.email || '').toLowerCase());
    return approver ? approver.status : 'pending';
  };

  const priorityOrder = { High: 3, Medium: 2, Low: 1 };

  function getPriorityValue(priority) {
    if (!priority) return 0;
    return priorityOrder[priority] || 0;
  }

  // Sort pending events by priority (High > Medium > Low > undefined), then by score descending
  const pendingEvents = events
    .filter(event => getApproverStatus(event) === 'pending')
    .sort((a, b) => {
      const pa = getPriorityValue(a.priority);
      const pb = getPriorityValue(b.priority);
      if (pa !== pb) return pb - pa;
      // If same priority, sort by score descending
      return (b.score || 0) - (a.score || 0);
    });
  const approvedEvents = events.filter(event => getApproverStatus(event) === 'approved');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-16 px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Navbar */}
        <div className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">Approver Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-blue-600 text-white rounded-2xl shadow-lg hover:scale-105 hover:from-blue-600 hover:to-pink-500 transition font-bold text-lg backdrop-blur-md border border-white/30"
            title="Logout"
          >
            <LogoutIcon className="w-6 h-6" /> Logout
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-blue-200">
          <button
            className={`px-6 py-3 text-lg font-bold rounded-t-lg focus:outline-none transition ${tab === 'pending' ? 'bg-white shadow text-blue-700 border border-b-0 border-blue-300' : 'bg-blue-100 text-blue-500 hover:bg-white'}`}
            onClick={() => setTab('pending')}
          >Pending Events</button>
          <button
            className={`px-6 py-3 text-lg font-bold rounded-t-lg focus:outline-none transition ${tab === 'approved' ? 'bg-white shadow text-green-700 border border-b-0 border-green-300' : 'bg-green-100 text-green-500 hover:bg-white'}`}
            onClick={() => setTab('approved')}
          >Approved Events</button>
        </div>
        {/* Tab Content */}
        {tab === 'pending' && (
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl p-10 border border-blue-200/40 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-blue-700">Pending Event Applications</h2>
            <div className="overflow-y-auto max-h-[400px] scroll-smooth">
              <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-lg text-blue-900/80">
                    <th>Title</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Days Left</th>
                    <th>Venue</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingEvents.map((event) => {
                    const approver = event.approvers.find(a => a.email.toLowerCase() === (user?.email || '').toLowerCase());
                    const status = approver ? approver.status : 'pending';
                    return (
                      <tr key={event._id} className="bg-white/80 rounded-xl shadow hover:scale-[1.01] transition">
                        <td className="py-4 px-3 font-semibold text-blue-800">{event.title}</td>
                        <td className="py-4 px-3 text-base">{event.eventType ? event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1) : ''}</td>
                        <td className="py-4 px-3 text-base">{event.date}</td>
                        <td className="py-4 px-3 text-base">{getDaysLeft(event.date)}</td>
                        <td className="py-4 px-3 text-base">{event.venue}</td>
                        <td className="py-4 px-3 text-base">
                          {event.priority ? (
                            <span className={`inline-block px-4 py-1 rounded-full text-sm font-extrabold shadow-lg tracking-wide uppercase border-2 ${event.priority === 'High' ? 'bg-red-500 text-white border-red-700' : event.priority === 'Medium' ? 'bg-yellow-400 text-yellow-900 border-yellow-600' : event.priority === 'Low' ? 'bg-green-400 text-green-900 border-green-600' : 'bg-gray-200 text-gray-700 border-gray-400'}`}>{event.priority}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-3 text-base">
                          {status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleAction(event._id, 'approved')}
                                className={`px-4 py-2 rounded-lg font-bold shadow transition bg-green-100 text-green-700 hover:bg-green-200`}
                                disabled={!!actionStatus[event._id]}
                              >
                                <CheckCircleIcon className="w-5 h-5 inline mr-1" /> Approve
                              </button>
                              <button
                                onClick={() => handleAction(event._id, 'rejected')}
                                className={`px-4 py-2 rounded-lg font-bold shadow transition bg-red-100 text-red-700 hover:bg-red-200 ml-2`}
                                disabled={!!actionStatus[event._id]}
                              >
                                <XCircleIcon className="w-5 h-5 inline mr-1" /> Reject
                              </button>
                            </>
                          ) : (
                            <span className={`ml-2 font-semibold ${status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {pendingEvents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-500 py-8 text-xl">No pending events.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === 'approved' && (
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl p-10 border border-green-200/40 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-green-700">Approved Events</h2>
            <div className="overflow-y-auto max-h-[400px] scroll-smooth">
              <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-lg text-green-900/80">
                    <th>Title</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Days Left</th>
                    <th>Venue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedEvents.map((event) => {
                    const approver = event.approvers.find(a => a.email.toLowerCase() === (user?.email || '').toLowerCase());
                    const status = approver ? approver.status : 'approved';
                    return (
                      <tr key={event._id} className="bg-white/80 rounded-xl shadow hover:scale-[1.01] transition">
                        <td className="py-4 px-3 font-semibold text-blue-800">{event.title}</td>
                        <td className="py-4 px-3 text-base">{event.eventType ? event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1) : ''}</td>
                        <td className="py-4 px-3 text-base">{event.date}</td>
                        <td className="py-4 px-3 text-base">{getDaysLeft(event.date)}</td>
                        <td className="py-4 px-3 text-base">{event.venue}</td>
                        <td className="py-4 px-3 text-base">
                          <span className="ml-2 font-semibold text-green-700">Approved</span>
                        </td>
                      </tr>
                    );
                  })}
                  {approvedEvents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-500 py-8 text-xl">No approved events.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 