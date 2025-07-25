const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue');

// GET /api/venues - list all venues
router.get('/', async (req, res) => {
  try {
    const venues = await Venue.find();
    res.json(venues);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// POST /api/venues/simulate - add a simulated list of venues
router.post('/simulate', async (req, res) => {
  const simulatedVenues = [
    { name: 'Main Auditorium', capacity: 200 },
    { name: 'Seminar Hall', capacity: 100 },
    { name: 'Open Ground', capacity: 500 },
    { name: 'Conference Room', capacity: 50 },
    { name: 'Mini Auditorium', capacity: 80 }
  ];
  await Venue.deleteMany({}); // Clear existing venues for simulation
  const venues = await Venue.insertMany(simulatedVenues);
  res.json(venues);
});

module.exports = router; 