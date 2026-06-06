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

// POST /api/push/telegram — save Telegram chat ID for current user
router.post('/telegram', protect, async (req, res) => {
  try {
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ message: 'chatId required' });
    await User.findByIdAndUpdate(req.user._id, { telegramChatId: chatId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/push/status — debug
router.get('/status', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('pushSubscription telegramChatId name');
  res.json({
    name: user.name,
    hasWebPush: !!user.pushSubscription,
    hasTelegram: !!user.telegramChatId,
    telegramChatId: user.telegramChatId || null,
    vapidPublicKeySet: !!process.env.VAPID_PUBLIC_KEY,
    telegramBotSet: !!process.env.TELEGRAM_BOT_TOKEN,
  });
});

// POST /api/push/test — send test push + email to yourself
router.post('/test', protect, async (req, res) => {
  const results = {};

  // Test web push
  try {
    await sendPushToUser(req.user._id, {
      title: 'Test 💕', body: 'Push works!', tag: 'test', data: { url: '/chat' },
    });
    results.webPush = 'sent';
  } catch (e) { results.webPush = e.message; }

  // Test email
  try {
    const { sendThinkingOfYouEmail } = require('../utils/email');
    const user = await User.findById(req.user._id).select('email name');
    await sendThinkingOfYouEmail(user.email, 'Test', user.name);
    results.email = `sent to ${user.email}`;
  } catch (e) { results.email = e.message; }

  res.json({ ok: true, results });
});

module.exports = router;
