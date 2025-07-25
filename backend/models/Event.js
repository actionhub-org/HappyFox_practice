const mongoose = require('mongoose');

const ApproverStatusSchema = new mongoose.Schema({
  email: String,
  role: String,
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  actedAt: Date
}, { _id: false });

const EventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: String,
  venue: String,
  eventType: String,
  organizer: String, // <-- Added field
  approvers: [ApproverStatusSchema],
  createdAt: { type: Date, default: Date.now },
  duration_days: { type: Number, default: 1 },
  expected_attendance: { type: Number, default: 0 }
});

module.exports = mongoose.model('Event', EventSchema); 