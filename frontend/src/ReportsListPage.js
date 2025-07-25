import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ReportsListPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5100/api/event/final-reports')
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setReports(data.reports || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch reports.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-lg">Loading reports...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-12">
      <div className="max-w-6xl mx-auto p-8 bg-white/90 rounded-3xl shadow-2xl mt-8">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-blue-900 drop-shadow">All Final Event Reports</h1>
        {reports.length === 0 ? (
          <div className="text-lg text-gray-600 text-center py-16">No final reports found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-900 text-lg">
                  <th className="px-6 py-3 rounded-tl-2xl">Title</th>
                  <th className="px-6 py-3">Date(s)</th>
                  <th className="px-6 py-3">Venue</th>
                  <th className="px-6 py-3">Organizer</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 rounded-tr-2xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(({ event, resource }, i) => (
                  <tr
                    key={event?._id || i}
                    className={`bg-white/90 hover:bg-blue-50 transition rounded-xl shadow ${i % 2 === 0 ? 'border-l-4 border-blue-200' : 'border-l-4 border-purple-200'}`}
                  >
                    <td className="px-6 py-4 font-bold text-blue-800 rounded-l-2xl">{event?.title || '-'}</td>
                    <td className="px-6 py-4">
                      {event?.startDate && event?.endDate
                        ? `${event.startDate} to ${event.endDate}`
                        : event?.date || '-'}
                    </td>
                    <td className="px-6 py-4">{event?.venue || '-'}</td>
                    <td className="px-6 py-4">{event?.organizer || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${resource?.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {resource?.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 rounded-r-2xl">
                      <Link
                        to={`/dashboard/report/${event?._id}`}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow hover:from-purple-500 hover:to-blue-500 transition text-base"
                      >
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 