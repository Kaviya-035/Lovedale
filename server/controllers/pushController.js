const webpush = require('web-push');
const User = require('../models/User');

// Generate VAPID keys once and store in env
// Run: node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(k);"
webpush.setVapidDetails(
  'mailto:lovedale@app.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// @desc  Save push subscription for current user
// @route POST /api/push/subscribe
const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ message: 'No subscription provided' });

    await User.findByIdAndUpdate(req.user._id, { pushSubscription: subscription });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Send a push notification to a specific user
// Used internally by socket handler
const sendPushToUser = async (userId, payload) => {
  try {
    const user = await User.findById(userId).select('pushSubscription');
    if (!user?.pushSubscription) return;

    await webpush.sendNotification(
      user.pushSubscription,
      JSON.stringify(payload)
    );
  } catch (err) {
    // Subscription expired or invalid — clear it
    if (err.statusCode === 410 || err.statusCode === 404) {
      await User.findByIdAndUpdate(userId, { pushSubscription: null });
    }
    console.error('Push notification error:', err.message);
  }
};

module.exports = { subscribe, sendPushToUser };
