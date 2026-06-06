// Email notifications via Resend HTTP API
// Uses HTTP (not SMTP) — works on Render free tier
// Free plan: send to any email once domain is verified
// Without domain: send only to account owner email
// resend.com — 3000 emails/month free

const LOVE_QUOTES = [
  "Every moment feels softer when you're on my mind.",
  "Distance means nothing when someone means everything.",
  "In a world full of temporary things, you are a perpetual feeling.",
  "You are the poem I never knew how to write.",
  "Even the quietest thoughts find their way back to you.",
  "Some feelings don't need words — they just need you.",
  "You make ordinary moments feel like magic.",
  "Missing you is a reminder of how lucky I am to have you.",
  "The best part of my day is every second I think of you.",
  "You are my favourite notification.",
  "Time stops differently when I'm with you in thought.",
  "I fall in love with the idea of you every single day.",
  "You are the warmth I reach for on cold days.",
  "Every love song makes more sense because of you.",
  "My heart keeps finding its way back to you.",
  "You're the kind of person worth every thought.",
  "Just thinking about you turns an ordinary moment into something beautiful.",
  "You live in the space between my heartbeats.",
  "Some people make the whole world feel smaller and sweeter — you are that person.",
  "I keep returning to thoughts of you like a favourite page in a book.",
  "You are the reason some moments feel endless.",
  "The world is a little brighter knowing you're in it.",
  "Thinking of you is the softest habit I have.",
  "You are someone I never get tired of thinking about.",
  "Love is strange — it turns distance into presence.",
  "A thought of you is always a good thought.",
  "You are my favourite distraction from everything else.",
  "The heart knows what the mind hasn't caught up to yet — and mine keeps choosing you.",
  "Every sunrise reminds me there are more moments to share with you.",
  "You are worth every pause in my day.",
];

const usedIndices = new Set();

const getUniqueQuote = () => {
  if (usedIndices.size >= LOVE_QUOTES.length) usedIndices.clear();
  let idx;
  do { idx = Math.floor(Math.random() * LOVE_QUOTES.length); } while (usedIndices.has(idx));
  usedIndices.add(idx);
  return LOVE_QUOTES[idx];
};

const sendThinkingOfYouEmail = async (toEmail, fromName, toName) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('RESEND_API_KEY not set — skipping email');
    return;
  }

  const quote     = getUniqueQuote();
  const firstName = toName ? toName.split(' ')[0] : toEmail.split('@')[0];
  const appUrl    = process.env.CLIENT_URL || 'https://lovedale-three.vercel.app';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0608;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:48px 24px 40px;">
  <div style="text-align:center;margin-bottom:36px;">
    <div style="display:inline-block;width:56px;height:56px;line-height:56px;background:linear-gradient(135deg,#f43f5e,#9d4edd);border-radius:50%;font-size:26px;text-align:center;">❤️</div>
    <p style="margin:8px 0 0;color:rgba(255,240,235,0.4);font-size:12px;letter-spacing:0.15em;text-transform:uppercase;">Lovedale</p>
  </div>
  <div style="background:#160a14;border:1px solid rgba(244,63,94,0.25);border-radius:28px;padding:48px 40px;text-align:center;">
    <div style="font-size:54px;margin-bottom:24px;line-height:1;">❤️‍🔥</div>
    <p style="margin:0 0 8px;color:rgba(255,240,235,0.5);font-size:14px;">Hi ${firstName},</p>
    <h1 style="margin:0 0 6px;color:#fff8f5;font-size:28px;font-weight:700;line-height:1.2;">${fromName} is thinking</h1>
    <h1 style="margin:0 0 28px;color:#f43f5e;font-size:28px;font-weight:700;line-height:1.2;">about you right now</h1>
    <div style="width:48px;height:2px;background:linear-gradient(90deg,transparent,#f43f5e,transparent);margin:0 auto 28px;border-radius:99px;"></div>
    <div style="background:rgba(244,63,94,0.07);border:1px solid rgba(244,63,94,0.18);border-left:3px solid #f43f5e;border-radius:16px;padding:22px 26px;margin-bottom:32px;text-align:left;">
      <p style="margin:0;color:rgba(255,240,235,0.85);font-size:16px;line-height:1.7;font-style:italic;">&ldquo;${quote}&rdquo;</p>
    </div>
    <p style="margin:0 0 36px;color:rgba(255,240,235,0.4);font-size:13px;line-height:1.8;">No need to reply. No need to do anything.<br>Just know that somewhere, someone smiled<br>because you exist. 🌹</p>
    <a href="${appUrl}/chat" style="display:inline-block;background:linear-gradient(135deg,#f43f5e,#c2185b);color:#fff;text-decoration:none;padding:16px 44px;border-radius:99px;font-size:15px;font-weight:700;box-shadow:0 12px 30px rgba(244,63,94,0.4);">Open Lovedale ❤️</a>
  </div>
  <p style="text-align:center;margin-top:28px;color:rgba(255,240,235,0.18);font-size:11px;line-height:1.7;">Sent with love via Lovedale 💕</p>
</div>
</body></html>`;

  try {
    const { Resend } = require('resend');
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from:    'Lovedale 💕 <onboarding@resend.dev>',
      to:      toEmail,
      subject: `${fromName} is thinking about you 💕`,
      html,
    });

    if (error) {
      console.error('Resend error:', error.message || JSON.stringify(error));
    } else {
      console.log(`✅ Email sent via Resend to ${toEmail} (id: ${data?.id}) — "${quote.slice(0, 45)}…"`);
    }
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};

module.exports = { sendThinkingOfYouEmail };
