const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;

const emails = [
  "hod@university.edu",
  "dean.acad@university.edu",
  "principal@university.edu",
  "cultural@university.edu",
  "dean.sa@university.edu",
  "techlead@university.edu",
  "sports@university.edu",
  "dean.sports@university.edu",
  "social@university.edu",
  "dean.community@university.edu",
  "admin@university.edu",
  "registrar@university.edu",
  "general@university.edu"
];

async function insertFreshApprovers() {
  await mongoose.connect(MONGODB_URI);
  const now = new Date();
  // Remove any existing users with these emails
  await User.deleteMany({ email: { $in: emails } });
  // Insert fresh list
  const users = emails.map(email => ({
    email,
    userType: "approver",
    supabaseId: "approver-" + email.replace(/[^a-z0-9]/gi, ''),
    createdAt: now,
    __v: 0
  }));
  await User.insertMany(users);
  await mongoose.disconnect();
  console.log('Inserted fresh approver users!');
}

insertFreshApprovers(); 