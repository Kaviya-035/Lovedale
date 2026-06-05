// Free email notifications via Resend
// 3000 emails/month free — resend.com

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

// Keep track of last used indices to avoid repeats
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
    console.log('Resend not configured — skipping email notification');
    return;
  }

  const quote = getUniqueQuote();
  const displayName = toName || toEmail.split('@')[0];
  const appUrl = process.env.CLIENT_URL || 'https://lovedale.vercel.app';

  try {
    const { Resend } = require('resend');
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: `${fromName} via Lovedale 💕 <notifications@lovedale-app.com>`,
      to: toEmail,
      subject: `${fromName} is thinking about you 💕`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fromName} is thinking about you</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0608;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px 40px;">

    <!-- Logo area -->
    <div style="text-align:center;margin-bottom:36px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:linear-gradient(135deg,#f43f5e,#9d4edd);border-radius:50%;font-size:26px;margin-bottom:12px;">
        ❤️
      </div>
      <p style="margin:0;color:rgba(255,240,235,0.4);font-size:13px;letter-spacing:0.12em;text-transform:uppercase;">Lovedale</p>
    </div>

    <!-- Main card -->
    <div style="background:rgba(26,12,24,0.95);border:1px solid rgba(244,63,94,0.22);border-radius:28px;padding:44px 40px;text-align:center;">

      <!-- Heart pulse -->
      <div style="font-size:52px;margin-bottom:24px;line-height:1;">❤️‍🔥</div>

      <!-- Recipient greeting -->
      <p style="margin:0 0 6px;color:rgba(255,240,235,0.55);font-size:14px;letter-spacing:0.05em;">
        Hi ${displayName}💗,
      </p>

      <!-- Main headline -->
      <h1 style="margin:0 0 20px;color:#fff8f5;font-size:26px;font-weight:700;line-height:1.25;letter-spacing:-0.5px;">
        ${fromName} is thinking<br>about you right now
      </h1>

      <!-- Divider -->
      <div style="width:48px;height:2px;background:linear-gradient(90deg,transparent,rgba(244,63,94,0.6),transparent);margin:0 auto 28px;border-radius:99px;"></div>

      <!-- Quote -->
      <blockquote style="margin:0 0 32px;padding:20px 24px;background:rgba(244,63,94,0.06);border:1px solid rgba(244,63,94,0.15);border-radius:16px;border-left:3px solid rgba(244,63,94,0.5);">
        <p style="margin:0;color:rgba(255,240,235,0.82);font-size:16px;line-height:1.65;font-style:italic;">
          "${quote}"
        </p>
      </blockquote>

      <!-- Soft message -->
      <p style="margin:0 0 36px;color:rgba(255,240,235,0.45);font-size:13px;line-height:1.7;">
        No need to reply. No need to do anything.<br>
        Just know that somewhere, someone smiled<br>because you exist. 🌹
      </p>

      <!-- CTA -->
      <a href="${appUrl}/chat"
         style="display:inline-block;background:linear-gradient(135deg,#f43f5e,#c2185b);color:white;text-decoration:none;padding:15px 40px;border-radius:99px;font-size:15px;font-weight:600;letter-spacing:0.04em;box-shadow:0 10px 28px rgba(244,63,94,0.38);">
        Open Lovedale ❤️
      </a>
    </div>

    <!-- Footer -->
    <p style="text-align:center;margin-top:28px;color:rgba(255,240,235,0.2);font-size:11px;line-height:1.6;">
      Sent with love via Lovedale — your private romantic space.<br>
      You received this because ${fromName} thought of you. 💕
    </p>

  </div>
</body>
</html>`,
    });

    console.log(`✅ Thinking-of-you email sent to ${toEmail} (quote: "${quote.slice(0,40)}…")`);
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

module.exports = { sendThinkingOfYouEmail };
