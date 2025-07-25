const mongoose = require('mongoose');

const ApproverSchema = new mongoose.Schema({
  role: { type: String, required: true },
  email: { type: String, required: true },
  event_types: [{ type: String, required: true }], // e.g. ['academic', 'tech', 'default']
  order: { type: Number, required: true } // order in the approval chain
});

module.exports = mongoose.model('Approver', ApproverSchema); 