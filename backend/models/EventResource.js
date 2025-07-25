const mongoose = require('mongoose');

const EventResourceSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, unique: true },
  recommended_resources: { type: Object, required: true },
  edited_resources: { type: Object },
  status: { type: String, enum: ['pending', 'confirmed'], default: 'pending' },
  confirmed_by: { type: String },
  confirmed_at: { type: Date },
  generated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EventResource', EventResourceSchema); 