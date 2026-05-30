const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Get advice or ideas from the Love Assistant
// @route   POST /api/ai/ask
// @access  Private
const askLoveAssistant = async (req, res) => {
  const { prompt, type } = req.body;
  const userPrompt = prompt || "Give me a romantic thought for today.";
  
  let systemInstruction = "You are Lovedale's AI Love Guru. You are a wise, romantic, and extremely helpful assistant for couples. You talk like a close friend who wants their relationship to thrive. Give short, sweet, and actionable advice. Be poetic, emotional, and always add a touch of magic with emojis. If a user asks for ideas, be creative and specific.";
  
  if (type === 'date_ideas') {
    systemInstruction = "You are Lovedale's Date Planner. Your mission is to help couples create unforgettable memories. Suggest 3 unique, romantic date ideas based on the user's request. Make them feel cozy and special. Use emojis.";
  } else if (type === 'message_help') {
    systemInstruction = "You are Lovedale's Romantic Poet. Help the user express their feelings perfectly. Provide 3 beautiful, emotional message options that they can send to their partner right now. Keep them short and meaningful.";
  }

  // Strategy 1: Try OpenAI (ChatGPT)
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.8,
      });

      const text = response.choices[0].message.content;
      if (text) return res.json({ text: text.trim(), provider: 'openai' });
    } catch (error) {
      console.error('OpenAI Error, falling back to Gemini:', error.message);
    }
  }

  // Strategy 2: Try Google Gemini (Free Option)
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction
      });

      const result = await model.generateContent(userPrompt);
      const text = result.response.text();
      if (text) return res.json({ text: text.trim(), provider: 'gemini' });
    } catch (error) {
      console.error('Gemini Error:', error.message);
    }
  }

  // Final Fallback
  const fallbacks = [
    "The Love Guru is currently meditating on your romance. Please try again in a moment! ✨",
    "Love is in the air, but the magical connection is a bit weak. One more try? 💖",
    "The Guru is gathering more romantic energy. Ask me again in a few seconds! 🌸"
  ];
  
  res.status(500).json({ 
    message: 'The Love Guru is currently resting. Please check your API keys in the .env file.',
    text: fallbacks[Math.floor(Math.random() * fallbacks.length)]
  });
};

module.exports = {
  askLoveAssistant
};
