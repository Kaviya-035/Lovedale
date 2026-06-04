const express = require('express');
const router = express.Router();
const { register, login, logout, getProfile, getMe, getUsers } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/logout', protect, logout);
router.get('/profile', protect, getProfile);
router.get('/me', protect, getMe);
router.get('/users', protect, getUsers);

// Save / update WhatsApp number
router.patch('/whatsapp', protect, async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    // Normalize: strip spaces, ensure starts with +
    const cleaned = whatsappNumber ? whatsappNumber.replace(/\s+/g, '').replace(/^00/, '+') : null;
    await User.findByIdAndUpdate(req.user._id, { whatsappNumber: cleaned });
    res.json({ ok: true, whatsappNumber: cleaned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
