import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Add this to your CSS (e.g., App.css):
// .pdf-export { background: #fff !important; color: #111 !important; }
// .pdf-export * { color: #111 !important; background: #fff !important; }

export default function ReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reportRef = useRef();

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5100/api/event/report/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setReport(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch report.');
        setLoading(false);
      });
  }, [id]);

  const handleDownloadPDF = async () => {
    const input = reportRef.current;
    if (!input) return;
    // Add PDF export class for solid background and dark text
    input.classList.add('pdf-export');
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for style to apply
    // Use high scale for crispness
    const scale = Math.max(window.devicePixelRatio || 2, 3);
    const canvas = await html2canvas(input, { scale, backgroundColor: '#fff', useCORS: true });
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 40; // 20pt margin each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let y = 20;
    // If content is longer than one page, split into multiple pages
    let remainingHeight = imgHeight;
    let position = 0;
    while (remainingHeight > 0) {
      pdf.addImage(imgData, 'PNG', 20, y, imgWidth, imgHeight, undefined, 'FAST');
      remainingHeight -= pageHeight - 40;
      if (remainingHeight > 0) {
        pdf.addPage();
        position -= pageHeight - 40;
      }
    }
    pdf.save(`event_report_${id}.pdf`);
    // Remove PDF export class
    input.classList.remove('pdf-export');
  };

  if (loading) return <div className="p-8 text-lg">Loading report...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!report) return null;

  const { event, resource, venue } = report;
  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow-lg mt-8">
      <Link to="/dashboard/resources" className="text-blue-600 hover:underline">&larr; Back to Resources</Link>
      <div className="flex justify-end mb-4 mt-2">
        <button
          onClick={handleDownloadPDF}
          className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold shadow hover:bg-green-800 transition"
        >
          Download PDF
        </button>
      </div>
      <div ref={reportRef} id="report-content">
        <h1 className="text-3xl font-bold mb-4 mt-2">Event Report</h1>
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Event Information</h2>
          <div><b>Title:</b> {event.title}</div>
          <div><b>Description:</b> {event.description}</div>
          <div><b>Date:</b> {event.date}</div>
          <div><b>Venue:</b> {event.venue}</div>
          <div><b>Type:</b> {event.eventType}</div>
          <div><b>Organizer:</b> {event.organizer}</div>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Approvers</h2>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Role</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Acted At</th>
              </tr>
            </thead>
            <tbody>
              {event.approvers.map((a, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1">{a.email}</td>
                  <td className="border px-2 py-1">{a.role}</td>
                  <td className="border px-2 py-1">{a.status}</td>
                  <td className="border px-2 py-1">{a.actedAt ? new Date(a.actedAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Resource Allocation</h2>
          {resource ? (
            <>
              <div><b>Status:</b> {resource.status}</div>
              <div><b>Confirmed By:</b> {resource.confirmed_by || '-'}</div>
              <div><b>Confirmed At:</b> {resource.confirmed_at ? new Date(resource.confirmed_at).toLocaleString() : '-'}</div>
              <div className="mt-2"><b>Resources:</b></div>
              <table className="w-full border mt-1">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Resource</th>
                    <th className="border px-2 py-1">Quantity/Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(resource.edited_resources || resource.recommended_resources || {}).map(([k, v]) => (
                    <tr key={k}>
                      <td className="border px-2 py-1">{k.replace(/_/g, ' ')}</td>
                      <td className="border px-2 py-1">{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : <div>No resource allocation found.</div>}
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Venue Details</h2>
          {venue && Object.keys(venue).length > 0 ? (
            <div className="flex flex-col gap-1">
              {Object.entries(venue).map(([key, value]) => (
                <div key={key}><b>{key.charAt(0).toUpperCase() + key.slice(1)}:</b> {String(value)}</div>
              ))}
            </div>
          ) : <div>No venue details found.</div>}
        </section>
      </div>
    </div>
  );
} 