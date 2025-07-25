const express = require('express');
const router = express.Router();
const { suggestSlots } = require('../utils/ai');
const fetch = require('node-fetch');
const Approver = require('../models/Approver');
const User = require('../models/User');
const Event = require('../models/Event');
const EventResource = require('../models/EventResource');
const nodemailer = require('nodemailer');
const chalk = require('chalk'); // For colored terminal output
const supabase = require('../utils/supabase');
const Venue = require('../models/Venue'); // Added Venue model import

// Setup Nodemailer transporter (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

async function sendResourceEmail({ to, subject, text, html }) {
  try {
    await transporter.sendMail({
      from: `EventBot <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log('Resource allocation email sent to:', to);
  } catch (err) {
    console.error('Failed to send resource allocation email:', err);
  }
}

// POST /api/event/suggest-slots
router.post('/suggest-slots', (req, res) => {
  const { beforeDate, afterDate, durationHours, venueName } = req.body;
  const slots = suggestSlots({ beforeDate, afterDate, durationHours, venueName });
  res.json({ slots });
});

// POST /api/event/quick-apply
router.post('/quick-apply', async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }
  try {
    const response = await fetch('http://localhost:5200/api/suggest-date', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to get suggestion' });
  }
});

// POST /api/event/book
router.post('/book', async (req, res) => {
  console.log('--- Event Booking Debug ---');
  console.log('Decoded user from JWT (req.user):', req.user);
  console.log('Request body:', req.body);
  let { title, description, date, venue, eventType, organizer, duration_days, expected_attendance, expected_count } = req.body;
  console.log('Booking event with organizer:', organizer);
  try {
    // Ensure eventType is lowercased for matching
    eventType = (eventType || '').toLowerCase();
    // Find approvers for this event type, ordered by 'order', case-insensitive
    const approvers = await Approver.find({ event_types: { $in: [eventType] } }).sort({ order: 1 });
    // Fallback: if no approvers for this type, use all approvers
    const approverList = (approvers.length ? approvers : await Approver.find({})).map(a => ({
      email: a.email,
      role: a.role,
      status: 'pending'
    }));
    // Use expected_attendance or expected_count (for compatibility with test script)
    const event = new Event({
      title,
      description,
      date,
      venue,
      eventType,
      organizer,
      approvers: approverList,
      duration_days: duration_days || 1,
      expected_attendance: expected_attendance || expected_count || 0
    });
    await event.save();
    console.log('Event saved to MongoDB:', event);
    console.log('--------------------------');
    res.json({ success: true, event });
  } catch (err) {
    console.error('Error booking event:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/event/for-approver?email=...
router.get('/for-approver', async (req, res) => {
  const email = req.query.email?.toLowerCase();
  if (!email) return res.json({ events: [] });
  // Return all events for this approver, regardless of status
  const events = await Event.find({ 'approvers.email': email });
  try {
    // Call the prioritizer API to rank events
    const prioritizerRes = await fetch('http://localhost:5200/api/prioritize-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events })
    });
    if (!prioritizerRes.ok) {
      // If prioritizer fails, fallback to original order
      return res.json({ events });
    }
    const prioritized = await prioritizerRes.json();
    // Return prioritized events (with priority/score)
    res.json({ events: prioritized });
  } catch (err) {
    console.error('Error calling prioritizer:', err);
    // Fallback to original order if error
    res.json({ events });
  }
});

// DELETE /api/event/for-approver?email=...
router.delete('/for-approver', async (req, res) => {
  const email = (req.query.email || '').toLowerCase();
  if (!email) return res.status(400).json({ error: 'Missing email' });
  try {
    // Remove all events where this email is in the approvers list
    const result = await Event.deleteMany({ 'approvers.email': email });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/event/for-organizer?email=...
router.get('/for-organizer', async (req, res) => {
  const email = req.query.email?.toLowerCase();
  if (!email) return res.json({ events: [] });
  const events = await Event.find({ organizer: email });
  res.json({ events });
});

// GET /api/event/report/:id
router.get('/report/:id', async (req, res) => {
  const eventId = req.params.id;
  try {
    // Fetch event details
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Fetch resource allocation for this event
    const resource = await EventResource.findOne({ event_id: eventId });

    // Fetch venue details
    let venue = null;
    if (event.venue) {
      venue = await Venue.findOne({ name: event.venue });
    }

    res.json({
      event,
      resource,
      venue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/event/final-reports
// (No authentication required)
router.get('/final-reports', async (req, res) => {
  try {
    // Find all confirmed resource allocations
    const confirmedResources = await EventResource.find({ status: 'confirmed' });
    const eventIds = confirmedResources.map(r => r.event_id);
    // Fetch all corresponding events
    const events = await Event.find({ _id: { $in: eventIds } });
    // Fetch all corresponding venues
    const venues = await Venue.find({});
    // Build the report list
    const reports = confirmedResources.map(resource => {
      const event = events.find(e => e._id.toString() === resource.event_id.toString());
      const venue = event && event.venue ? venues.find(v => v.name === event.venue) : null;
      return {
        event,
        resource,
        venue
      };
    });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/event/approved
router.get('/approved', async (req, res) => {
  try {
    // Find all events where all approvers are approved
    const events = await Event.find({
      approvers: { $not: { $elemMatch: { status: { $ne: 'approved' } } } }
    });
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed approvers for all event types
router.post('/seed-approvers', async (req, res) => {
  const approvers = [
    // Academic
    { role: 'HOD', email: 'hod@university.edu', event_types: ['academic', 'tech', 'default'], order: 1 },
    { role: 'Dean Academic', email: 'dean.acad@university.edu', event_types: ['academic'], order: 2 },
    { role: 'Principal', email: 'principal@university.edu', event_types: ['academic', 'cultural', 'tech', 'default'], order: 3 },
    // Cultural
    { role: 'Cultural Coordinator', email: 'cultural@university.edu', event_types: ['cultural'], order: 1 },
    { role: 'Dean Student Affairs', email: 'dean.sa@university.edu', event_types: ['cultural'], order: 2 },
    // Technical
    { role: 'Tech Club Lead', email: 'techlead@university.edu', event_types: ['tech'], order: 1 },
    // Sports
    { role: 'Sports Coordinator', email: 'sports@university.edu', event_types: ['sports'], order: 1 },
    { role: 'Dean Sports', email: 'dean.sports@university.edu', event_types: ['sports'], order: 2 },
    // Social/Community
    { role: 'Social Service Head', email: 'social@university.edu', event_types: ['social'], order: 1 },
    { role: 'Dean Community', email: 'dean.community@university.edu', event_types: ['social'], order: 2 },
    // Administrative
    { role: 'Admin Officer', email: 'admin@university.edu', event_types: ['administrative'], order: 1 },
    { role: 'Registrar', email: 'registrar@university.edu', event_types: ['administrative'], order: 2 },
    // Other/General
    { role: 'General Coordinator', email: 'general@university.edu', event_types: ['other'], order: 1 },
  ];
  try {
    await Approver.deleteMany({});
    await Approver.insertMany(approvers);
    res.json({ message: 'Approvers seeded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/event/is-approver?email=...
router.get('/is-approver', async (req, res) => {
  const email = req.query.email?.toLowerCase();
  if (!email) return res.json({ isApprover: false });
  const user = await User.findOne({ email, userType: 'approver' });
  res.json({ isApprover: !!user });
});

// PATCH /api/event/approve
router.patch('/approve', async (req, res) => {
  let { eventId, approverEmail, status } = req.body;
  if (!eventId || !approverEmail || !status) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  approverEmail = approverEmail.toLowerCase();
  console.log('PATCH /api/event/approve', { eventId, approverEmail, status });
  try {
    const event = await Event.findOneAndUpdate(
      { _id: eventId },
      { $set: { "approvers.$[elem].status": status, "approvers.$[elem].actedAt": new Date() } },
      { new: true, arrayFilters: [{ "elem.email": approverEmail }] }
    );
    console.log('Updated event:', event);
    if (!event) return res.status(404).json({ error: 'Event or approver not found' });

    // Debug: Log all approver statuses
    console.log('Approver statuses:', event.approvers.map(a => a.status));
    if (event.approvers.every(a => a.status === 'approved')) {
      console.log('All approvers approved, triggering Gemini resource recommendation for event:', event._id);
      try {
        // Gather event and past events
        const pastEvents = await Event.find({ eventType: event.eventType, venue: event.venue, 'approvers.status': 'approved' }).limit(5);
        // Prepare payload for Gemini
        const geminiPayload = {
          event_type: event.eventType,
          venue: event.venue,
          duration_days: event.duration_days,
          expected_attendance: event.expected_attendance,
          past_events: pastEvents.map(e => ({
            event_type: e.eventType,
            venue: e.venue,
            resources: e.recommended_resources || {}
          }))
        };
        // Call Gemini API for resource recommendation
        const geminiResponse = await fetch('http://localhost:5200/api/resource-recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload)
        });
        const recommendedResources = await geminiResponse.json();
        console.log('Gemini recommended resources:', recommendedResources);
        // Store in EventResource collection
        const upsertResult = await EventResource.findOneAndUpdate(
          { event_id: event._id },
          {
            event_id: event._id,
            recommended_resources: recommendedResources,
            status: 'pending',
            generated_at: new Date()
          },
          { upsert: true, new: true }
        );
        console.log('Resource recommendation stored for event:', event._id, upsertResult);
      } catch (err) {
        console.error('Error during resource recommendation:', err);
      }
    }
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/event/apply-volunteer
router.post('/apply-volunteer', async (req, res) => {
  const { eventId, name, email, availability, reason } = req.body;
  if (!eventId || !email) return res.status(400).json({ error: 'Missing eventId or email' });
  // TODO: Save volunteer application to DB (for now, just acknowledge)
  console.log(`Volunteer application: ${email} for event ${eventId}`);
  if (name) console.log(`Name: ${name}`);
  if (availability) console.log(`Availability: ${availability}`);
  if (reason) console.log(`Reason: ${reason}`);
  try {
    // Fetch event details
    const event = await Event.findById(eventId);
    // Send confirmation email with nodemailer
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Volunteer Application Confirmation for ${event.title}`,
      text: `Hello${name ? ' ' + name : ''},\n\nThank you for applying as a volunteer for the event: ${event.title}.\n\nEvent Details:\n- Date: ${event.date}\n- Venue: ${event.venue}\n- Organizer: ${event.organizer || 'N/A'}\n\nYour Availability for whole event: ${availability || 'N/A'}\nReason for interest: ${reason || 'N/A'}\n\nWe will contact you with further details.\n\nBest regards,\nCampus Event Automation Team`,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Volunteer confirmation email sent to ${email}`);
    res.json({ success: true, message: 'Applied as volunteer. Confirmation sent to email.' });
  } catch (err) {
    console.error('Error sending volunteer email:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/event/apply-participant
router.post('/apply-participant', async (req, res) => {
  const { eventId, name, email, reason } = req.body;
  if (!eventId || !email) return res.status(400).json({ error: 'Missing eventId or email' });
  // TODO: Save participant application to DB (for now, just acknowledge)
  console.log(`Participant application: ${email} for event ${eventId}`);
  if (name) console.log(`Name: ${name}`);
  if (reason) console.log(`Reason: ${reason}`);
  try {
    // Fetch event details for pass
    const event = await Event.findById(eventId);
    // Simulate pass
    const pass = `PASS-${eventId.slice(-6).toUpperCase()}`;
    // Send email with nodemailer
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Your Event Pass for ${event.title}`,
      text: `Hello${name ? ' ' + name : ''},\n\nThank you for applying to participate in the event: ${event.title}.\n\nEvent Details:\n- Date: ${event.date}\n- Venue: ${event.venue}\n- Organizer: ${event.organizer || 'N/A'}\n\nReason for interest: ${reason || 'N/A'}\n\nYour Event Pass: ${pass}\n\nPlease show this pass at the event entrance.\n\nBest regards,\nCampus Event Automation Team`,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Pass email sent to ${email}`);
    res.json({ success: true, message: 'Applied as participant. Pass sent to email.', pass });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ error: err.message });
  }
});

// Resource to contact email mapping
const RESOURCE_CONTACTS = {
  camera: 'deebakbalaji18@gmail.com',
  mic: 'mic-team@university.edu',
  projector: 'av-team@university.edu',
  cleaning_staff: 'cleaning@university.edu',
  electric_support: 'electric@university.edu',
  wifi_support: 'it@university.edu'
};

async function sendResourceRequests(event, edited_resources) {
  const mailStatus = [];
  for (const [resource, value] of Object.entries(edited_resources)) {
    const to = RESOURCE_CONTACTS[resource];
    if (!to) continue;
    const resourceLabel = resource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const subject = `Resource Request: ${resourceLabel} for Event "${event.title}" (${event.date})`;
    const text = `Dear ${resourceLabel} Team,\n\nThe following event requires your support:\n\nEvent: ${event.title}\nDate: ${event.date}\nVenue: ${event.venue}\nRequested: ${typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value + ' ' + resourceLabel}\n\nPlease reply to this email with the quantity you can provide, or click the link below to confirm.\n\nThank you,\nEventBot\n`;
    const html = `<p>Dear <b>${resourceLabel} Team</b>,</p>\n<p>The following event requires your support:</p>\n<ul>\n  <li><b>Event:</b> ${event.title}</li>\n  <li><b>Date:</b> ${event.date}</li>\n  <li><b>Venue:</b> ${event.venue}</li>\n  <li><b>Requested:</b> ${typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value + ' ' + resourceLabel}</li>\n</ul>\n<p>Please reply to this email with the quantity you can provide, or <a href=\"mailto:${event.organizer}?subject=Resource%20Confirmation%20for%20${event.title}\">click here to confirm</a>.</p>\n<p>Thank you,<br/>EventBot</p>`;
    try {
      await sendResourceEmail({ to, subject, text, html });
      console.log(chalk.green(`✔ Resource allocation email sent to ${to} for resource: ${resource}`));
      mailStatus.push({ resource, to, status: 'success' });
    } catch (err) {
      console.error(chalk.red(`✖ Failed to send resource allocation email to ${to} for resource: ${resource}`), err);
      mailStatus.push({ resource, to, status: 'error', error: err.message });
    }
  }
  return mailStatus;
}

// PATCH /api/resource/confirm
router.patch('/resource/confirm', async (req, res) => {
  const { event_id, edited_resources, confirmed_by } = req.body;
  if (!event_id || !edited_resources || !confirmed_by) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  try {
    const resourceDoc = await EventResource.findOneAndUpdate(
      { event_id },
      {
        edited_resources,
        status: 'confirmed',
        confirmed_by,
        confirmed_at: new Date()
      },
      { new: true }
    );
    if (!resourceDoc) return res.status(404).json({ error: 'Resource document not found' });
    // Send Teams notification (pseudo-code, replace with your webhook URL)
    const event = await Event.findById(event_id);
    const teamsCard = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "summary": "Resource Request for Event",
      "themeColor": "0076D7",
      "title": "Resource Allocation Needed",
      "sections": [{
        "facts": [
          { "name": "Event", "value": event.title },
          { "name": "Venue", "value": event.venue },
          { "name": "Date", "value": event.date },
          ...Object.entries(edited_resources).map(([k, v]) => ({ name: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: String(v) }))
        ],
        "markdown": true
      }],
      "potentialAction": [{
        "@type": "HttpPOST",
        "name": "Acknowledge",
        "target": "https://your-backend.com/api/resource-ack"
      }]
    };
    if (process.env.TEAMS_WEBHOOK_URL) {
      await fetch(process.env.TEAMS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsCard)
      });
    }
    let mailStatus = [];
    // Send Gmail notification to organizer
    if (event && event.organizer) {
      const subject = `Resource Allocation Confirmed for Event: ${event.title}`;
      const text = `Resources for ${event.title} (${event.date}):\n` +
        Object.entries(edited_resources).map(([k, v]) => `${k}: ${v}`).join('\n');
      const html = `<h2>Resource Allocation Confirmed</h2>\n        <p><b>Event:</b> ${event.title} (${event.date})</p>\n        <ul>${Object.entries(edited_resources).map(([k, v]) => `<li><b>${k.replace(/_/g, ' ')}:</b> ${v}</li>`).join('')}</ul>`;
      try {
        await sendResourceEmail({
          to: event.organizer,
          subject,
          text,
          html
        });
        console.log(chalk.green(`✔ Confirmation email sent to organizer: ${event.organizer}`));
        mailStatus.push({ resource: 'organizer', to: event.organizer, status: 'success' });
      } catch (err) {
        console.error(chalk.red(`✖ Failed to send confirmation email to organizer: ${event.organizer}`), err);
        mailStatus.push({ resource: 'organizer', to: event.organizer, status: 'error', error: err.message });
      }
    }
    // Send resource-specific emails
    if (event && edited_resources) {
      const resourceMailStatus = await sendResourceRequests(event, edited_resources);
      mailStatus = mailStatus.concat(resourceMailStatus);
    }
    res.json({ success: true, resource: resourceDoc, mailStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/resource/for-organizer?email=...
router.get('/resource/for-organizer', async (req, res) => {
  const email = req.query.email?.toLowerCase();
  if (!email) return res.json({ resources: [] });
  // Find all events for this organizer
  const events = await Event.find({ organizer: email });
  const eventIds = events.map(e => e._id);
  // Find all EventResource docs for these events
  const resources = await EventResource.find({ event_id: { $in: eventIds } });
  res.json({ resources });
});

// JWT authentication middleware
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = data.user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token verification failed' });
  }
}

// Apply JWT middleware to all event routes
router.use(requireAuth);

module.exports = router; 