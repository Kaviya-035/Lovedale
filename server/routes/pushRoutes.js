const express = require('express');
const router = express.Router();
const { subscribe, sendPushToUser } = require('../controllers/pushController');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// GET /api/push/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

router.post('/subscribe', protect, subscribe);

// GET /api/push/status — debug: check if current user has a subscription saved
router.get('/status', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('pushSubscription name');
  res.json({
    name: user.name,
    hasSubscription: !!user.pushSubscription,
    vapidPublicKeySet: !!process.env.VAPID_PUBLIC_KEY,
    vapidPrivateKeySet: !!process.env.VAPID_PRIVATE_KEY,
  });
});

// POST /api/push/test — debug: send a test push to yourself
router.post('/test', protect, async (req, res) => {
  try {
    await sendPushToUser(req.user._id, {
      title: 'Test notification 💕',
      body: 'Push notifications are working!',
      tag: 'test',
      data: { url: '/chat' },
    });
    res.json({ ok: true, message: 'Test push sent' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
