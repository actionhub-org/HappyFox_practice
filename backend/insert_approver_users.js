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

async function insertApprovers() {
  await mongoose.connect(MONGODB_URI);
  const now = new Date();
  for (const email of emails) {
    const supabaseId = "approver-" + email.replace(/[^a-z0-9]/gi, '');
    await User.updateOne(
      { email },
      {
        $set: {
          userType: "approver",
          supabaseId,
          createdAt: now,
          __v: 0
        }
      },
      { upsert: true }
    );
    console.log(`Upserted user: ${email} with supabaseId: ${supabaseId}`);
  }
  await mongoose.disconnect();
  console.log('Upserted all approver users!');
}

insertApprovers(); 