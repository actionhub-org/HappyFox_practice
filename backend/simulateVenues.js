const mongoose = require('mongoose');
const Venue = require('./models/Venue');

// Replace with your actual MongoDB connection string or ensure .env is set
const MONGODB_URI = "mongodb+srv://Adarsh:ActionHub@action-hub-cluster.gyq5cyf.mongodb.net/?retryWrites=true&w=majority&appName=Action-Hub-Cluster"//Adarsh:Action_Hub@action-hub-cluster.gyq5cyf.mongodb.net/?retryWrites=true&w=majority&appName=Action-Hub-Cluster;

const simulatedVenues = [
  { name: 'Main Auditorium', capacity: 200 },
  { name: 'Seminar Hall', capacity: 100 },
  { name: 'Open Ground', capacity: 500 },
  { name: 'Conference Room', capacity: 50 },
  { name: 'Mini Auditorium', capacity: 80 }
];

async function simulateVenues() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await Venue.deleteMany({});
    const venues = await Venue.insertMany(simulatedVenues);
    console.log('Simulated venues added:', venues);
    process.exit(0);
  } catch (err) {
    console.error('Error simulating venues:', err);
    process.exit(1);
  }
}

simulateVenues(); 