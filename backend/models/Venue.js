const mongoose = require('mongoose');

const VenueSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  bookings: [
    {
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
      date: String
    }
  ]
});

module.exports = mongoose.model('Venue', VenueSchema); 