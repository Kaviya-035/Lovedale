const express = require('express');
const router = express.Router();
const { subscribe } = require('../controllers/pushController');
const { protect } = require('../middleware/auth');

// GET /api/push/vapid-public-key — client needs this to subscribe
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', protect, subscribe);

module.exports = router;
