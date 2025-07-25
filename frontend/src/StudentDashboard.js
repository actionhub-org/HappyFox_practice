import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function getAppliedEventsLS(email) {
  if (!email) return [];
  try {
    return JSON.parse(localStorage.getItem(`appliedEvents_${email}`)) || [];
  } catch {
    return [];
  }
}
function setAppliedEventsLS(email, appliedEvents) {
  if (!email) return;
  localStorage.setItem(`appliedEvents_${email}`, JSON.stringify(appliedEvents));
}

function EventDetailsModal({ open, event, onClose, onApplyStudent, onApplyVolunteer, loading, appliedType, passMsg, alreadyAppliedType }) {
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: '', email: '', reason: '' });
  const [volunteerForm, setVolunteerForm] = useState({ name: '', email: '', availability: '', reason: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) {
      setShowStudentForm(false);
      setShowVolunteerForm(false);
      setStudentForm({ name: '', email: '', reason: '' });
      setVolunteerForm({ name: '', email: '', availability: '', reason: '' });
      setFormError('');
    }
  }, [open, event]);

  const handleStudentFormChange = (e) => {
    setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  };
  const handleVolunteerFormChange = (e) => {
    setVolunteerForm({ ...volunteerForm, [e.target.name]: e.target.value });
  };

  const handleStudentFormSubmit = (e) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.email || !studentForm.reason) {
      setFormError('All fields are required.');
      return;
    }
    setFormError('');
    onApplyStudent(studentForm);
  };
  const handleVolunteerFormSubmit = (e) => {
    e.preventDefault();
    if (!volunteerForm.name || !volunteerForm.email || !volunteerForm.availability || !volunteerForm.reason) {
      setFormError('All fields are required.');
      return;
    }
    setFormError('');
    onApplyVolunteer(volunteerForm);
  };

  if (!open || !event) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl p-0 max-w-2xl w-full relative animate-fade-in flex flex-col border-2 border-blue-200">
        {/* Accent bar */}
        <div className="h-3 rounded-t-3xl bg-gradient-to-r from-blue-500 via-purple-400 to-pink-400 w-full mb-2" />
        <button onClick={onClose} className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-blue-600" title="Close">×</button>
        <div className="p-10 flex flex-col gap-6">
          <h2 className="text-3xl font-extrabold text-blue-800 mb-2 text-center">{event.title}</h2>
          <div className="flex flex-wrap gap-6 justify-center text-lg mb-2">
            <div className="flex items-center gap-2"><span role="img" aria-label="calendar">📅</span> <span>{event.date}</span></div>
            <div className="flex items-center gap-2"><span role="img" aria-label="location">📍</span> <span>{event.venue}</span></div>
            {event.organizer && <div className="flex items-center gap-2"><span role="img" aria-label="person">👤</span> <span>{event.organizer}</span></div>}
            {event.eventType && <div className="flex items-center gap-2"><span className="font-bold">Type:</span> <span className="capitalize">{event.eventType}</span></div>}
          </div>
          <div className="border-t pt-4 max-h-48 overflow-y-auto text-gray-700 text-base leading-relaxed">
            <b>Description:</b>
            <div className="whitespace-pre-line mt-1">{event.description}</div>
          </div>
          {appliedType === 'student' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center text-lg font-semibold shadow flex flex-col items-center gap-2">
              <span className="text-3xl">✅</span>
              {passMsg || 'Application successful! Pass sent to your email.'}
            </div>
          )}
          {appliedType === 'volunteer' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center text-lg font-semibold shadow flex flex-col items-center gap-2">
              <span className="text-3xl">✅</span>
              Volunteer application successful! Confirmation sent to your email.
            </div>
          )}
          {!appliedType && !showStudentForm && !showVolunteerForm && (
            <div className="flex gap-4 mt-4 justify-center">
              <button
                className={`px-8 py-3 rounded-xl font-bold shadow-lg transition text-lg ${alreadyAppliedType === 'student' ? 'bg-blue-200 text-blue-700 cursor-not-allowed' : alreadyAppliedType === 'volunteer' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-800 hover:to-blue-600'}`}
                onClick={() => setShowStudentForm(true)}
                disabled={alreadyAppliedType === 'student' || alreadyAppliedType === 'volunteer'}
              >
                {alreadyAppliedType === 'student' ? 'Applied as Student' : alreadyAppliedType === 'volunteer' ? 'Already applied as Volunteer' : 'Apply as a Student'}
              </button>
              <button
                className={`px-8 py-3 rounded-xl font-bold shadow-lg transition text-lg ${alreadyAppliedType === 'volunteer' ? 'bg-green-200 text-green-700 cursor-not-allowed' : alreadyAppliedType === 'student' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-green-800 text-white hover:from-green-800 hover:to-green-600'}`}
                onClick={() => setShowVolunteerForm(true)}
                disabled={alreadyAppliedType === 'volunteer' || alreadyAppliedType === 'student'}
              >
                {alreadyAppliedType === 'volunteer' ? 'Applied as Volunteer' : alreadyAppliedType === 'student' ? 'Already applied as Student' : 'Apply as a Volunteer'}
              </button>
            </div>
          )}
          {showStudentForm && !appliedType && (
            <form className="flex flex-col gap-4 mt-2" onSubmit={handleStudentFormSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                className="border rounded-lg px-4 py-2 text-lg"
                value={studentForm.name}
                onChange={handleStudentFormChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                className="border rounded-lg px-4 py-2 text-lg"
                value={studentForm.email}
                onChange={handleStudentFormChange}
                required
              />
              <textarea
                name="reason"
                placeholder="Reason for interest"
                className="border rounded-lg px-4 py-2 text-lg min-h-[80px]"
                value={studentForm.reason}
                onChange={handleStudentFormChange}
                required
              />
              {formError && <div className="text-red-600 text-sm">{formError}</div>}
              <div className="flex gap-4 mt-2 justify-center">
                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold shadow-lg hover:from-blue-800 hover:to-blue-600 transition text-lg"
                  disabled={loading}
                >
                  {loading ? 'Applying...' : 'Submit Application'}
                </button>
                <button
                  type="button"
                  className="px-8 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold shadow hover:bg-gray-300 transition text-lg"
                  onClick={() => setShowStudentForm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {showVolunteerForm && !appliedType && (
            <form className="flex flex-col gap-4 mt-2" onSubmit={handleVolunteerFormSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                className="border rounded-lg px-4 py-2 text-lg"
                value={volunteerForm.name}
                onChange={handleVolunteerFormChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                className="border rounded-lg px-4 py-2 text-lg"
                value={volunteerForm.email}
                onChange={handleVolunteerFormChange}
                required
              />
              <select
                name="availability"
                className="border rounded-lg px-4 py-2 text-lg"
                value={volunteerForm.availability}
                onChange={handleVolunteerFormChange}
                required
              >
                <option value="">Availability for whole event?</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <textarea
                name="reason"
                placeholder="Reason for interest"
                className="border rounded-lg px-4 py-2 text-lg min-h-[80px]"
                value={volunteerForm.reason}
                onChange={handleVolunteerFormChange}
                required
              />
              {formError && <div className="text-red-600 text-sm">{formError}</div>}
              <div className="flex gap-4 mt-2 justify-center">
                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-800 text-white font-bold shadow-lg hover:from-green-800 hover:to-green-600 transition text-lg"
                  disabled={loading}
                >
                  {loading ? 'Applying...' : 'Submit Application'}
                </button>
                <button
                  type="button"
                  className="px-8 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold shadow hover:bg-gray-300 transition text-lg"
                  onClick={() => setShowVolunteerForm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {loading && <div className="text-center text-blue-600 mt-2">Processing...</div>}
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [appliedType, setAppliedType] = useState(null); // 'student' or 'volunteer'
  const [passMsg, setPassMsg] = useState('');
  const [user, setUser] = useState(null);
  const [appliedEvents, setAppliedEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5100/api/event/approved')
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch approved events.');
        setLoading(false);
      });
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        setAppliedEvents(getAppliedEventsLS(data.user.email));
      }
    });
  }, []);

  const handleCardClick = (event) => {
    setSelectedEvent(event);
    setModalOpen(true);
    setAppliedType(null);
    setPassMsg('');
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
    setAppliedType(null);
    setPassMsg('');
  };

  const handleApplyStudent = async (form) => {
    setApplyLoading(true);
    const res = await fetch('http://localhost:5100/api/event/apply-participant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: selectedEvent._id, name: form.name, email: form.email, reason: form.reason })
    });
    const data = await res.json();
    setAppliedType('student');
    setPassMsg(data.pass ? `Your pass: ${data.pass} (also sent to your email)` : 'Application successful! Pass sent to your email.');
    // Save to localStorage
    const newApplied = [...appliedEvents, { eventId: selectedEvent._id, type: 'student', title: selectedEvent.title }];
    setAppliedEvents(newApplied);
    setAppliedEventsLS(user.email, newApplied);
    setApplyLoading(false);
  };

  const handleApplyVolunteer = async (form) => {
    setApplyLoading(true);
    await fetch('http://localhost:5100/api/event/apply-volunteer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: selectedEvent._id, name: form.name, email: form.email, availability: form.availability, reason: form.reason })
    });
    setAppliedType('volunteer');
    // Save to localStorage
    const newApplied = [...appliedEvents, { eventId: selectedEvent._id, type: 'volunteer', title: selectedEvent.title }];
    setAppliedEvents(newApplied);
    setAppliedEventsLS(user.email, newApplied);
    setApplyLoading(false);
  };

  const getAlreadyAppliedType = (eventId) => {
    const found = appliedEvents.find(a => a.eventId === eventId);
    return found ? found.type : null;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    navigate('/', { replace: true });
  };

  if (loading) return <div className="p-8 text-lg">Loading approved events...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="flex justify-between items-center px-4 md:px-12 pt-8">
        <h1 className="text-3xl font-extrabold text-blue-900">Student Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="font-semibold">Welcome{user ? `, ${user.email}` : ''}</span>
          <button onClick={handleLogout} className="px-6 py-2 rounded bg-gray-300 hover:bg-gray-400 font-bold">Logout</button>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mt-8 mb-8 text-blue-800">Events</h2>
      {appliedEvents.length > 0 && (
        <div className="flex flex-col items-center mb-10">
          <div className="w-full max-w-3xl">
            <h3 className="text-xl font-bold text-green-800 mb-2 text-center">Applied Events</h3>
            <ul className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 border border-green-300">
              {appliedEvents.map(a => (
                <li key={a.eventId} className="flex items-center gap-4 text-lg justify-between">
                  <span className="font-semibold text-blue-900">{a.title}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${a.type === 'student' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>{a.type === 'student' ? 'Student' : 'Volunteer'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {events.length === 0 ? (
        <div className="text-lg text-gray-600 text-center">No approved events found.</div>
      ) : (
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-12 px-4 md:px-0">
          {events.map(event => (
            <div
              key={event._id}
              className={`bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-2 border border-blue-200 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 ${getAlreadyAppliedType(event._id) ? 'opacity-60' : ''} min-h-[220px] justify-between`}
              onClick={() => handleCardClick(event)}
            >
              <h3 className="text-lg font-bold mb-2 text-blue-900 text-center">{event.title}</h3>
              <div className="flex flex-col flex-1 justify-end">
                <div className="flex justify-center mt-8">
                  <span className={`font-semibold px-4 py-1 rounded-full ${getAlreadyAppliedType(event._id) ? 'bg-blue-200 text-blue-800' : 'bg-blue-50 text-blue-700'}`}>{getAlreadyAppliedType(event._id) ? (getAlreadyAppliedType(event._id) === 'student' ? 'Applied as Student' : 'Applied as Volunteer') : 'Apply'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <EventDetailsModal
        open={modalOpen}
        event={selectedEvent}
        onClose={handleCloseModal}
        onApplyStudent={handleApplyStudent}
        onApplyVolunteer={handleApplyVolunteer}
        loading={applyLoading}
        appliedType={appliedType}
        passMsg={passMsg}
        alreadyAppliedType={selectedEvent ? getAlreadyAppliedType(selectedEvent._id) : null}
      />
    </div>
  );
} 