const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const User = require('../models/User');
const Approver = require('../models/Approver');

// POST /api/user (expects: Authorization: Bearer <access_token>)
router.post('/', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  // Verify token with Supabase
  const { data: userData, error } = await supabase.auth.getUser(token);

  if (error) return res.status(401).json({ error: 'Invalid Supabase token' });

  const { id: supabaseId, email } = userData.user;

  try {
    let user = await User.findOne({ supabaseId });

    if (!user) {
      // Check if this email is an approver (case-insensitive)
      const approver = await Approver.findOne({ email: email.toLowerCase() });
      user = new User({ supabaseId, email, userType: approver ? 'approver' : 'organizer' });
      await user.save();
    }
    

    res.status(200).json({ message: 'User linked to MongoDB', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set userType for a user
router.patch('/set-role', async (req, res) => {
  const { email, userType } = req.body;
  if (!email || !userType) return res.status(400).json({ error: 'Missing email or userType' });
  const user = await User.findOneAndUpdate({ email }, { userType }, { new: true, upsert: true });
  res.json(user);
});

// Get userType for a user
router.get('/get-role', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const user = await User.findOne({ email });
  res.json({ userType: user?.userType || null });
});

module.exports = router;
