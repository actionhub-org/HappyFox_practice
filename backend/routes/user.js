const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const User = require('../models/User');

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
      user = new User({ supabaseId, email });
      await user.save();
    }

    res.status(200).json({ message: 'User linked to MongoDB', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
