// WhatsApp notification via Twilio
// Free sandbox: https://www.twilio.com/console/sms/whatsapp/sandbox

const SWEET_MESSAGES = [
  "Someone special is thinking of you right now 💕",
  "You just crossed someone's mind... and their heart ❤️",
  "A little love note just for you 🌸",
  "You're being thought about at this very moment 💖",
  "Someone's heart just skipped a beat thinking of you 💓",
  "A quiet moment, and their thoughts found you 🌙",
  "You live rent-free in someone's heart 💝",
  "Missing you silently but deeply ❤️‍🔥",
];

const getRandomMessage = () =>
  SWEET_MESSAGES[Math.floor(Math.random() * SWEET_MESSAGES.length)];

const sendWhatsAppMessage = async (toNumber, fromName) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886

  if (!accountSid || !authToken || !fromNumber) {
    console.log('Twilio not configured — skipping WhatsApp notification');
    return;
  }
  if (!toNumber) return;

  try {
    const client = require('twilio')(accountSid, authToken);

    // Ensure number is in whatsapp: format
    const to = toNumber.startsWith('whatsapp:')
      ? toNumber
      : `whatsapp:${toNumber}`;

    const body = `💕 *${fromName} is thinking about you!*\n\n${getRandomMessage()}\n\n_— Lovedale_`;

    await client.messages.create({ from: fromNumber, to, body });
    console.log(`✅ WhatsApp sent to ${to}`);
  } catch (err) {
    console.error('WhatsApp send error:', err.message);
  }
};

module.exports = { sendWhatsAppMessage };
