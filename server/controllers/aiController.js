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

// @desc    Generate a cinematic relationship movie script from memories
// @route   POST /api/ai/movie
// @access  Private
const generateMovie = async (req, res) => {
  const { memories } = req.body; // [{ title, description, date, mediaUrl, mediaType }]

  if (!memories || memories.length === 0) {
    return res.status(400).json({ message: 'No memories provided' });
  }

  const memorySummary = memories
    .map((m, i) => `${i + 1}. "${m.title}" (${new Date(m.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})${m.description ? ': ' + m.description : ''}`)
    .join('\n');

  const prompt = `You are a romantic storyteller creating a cinematic "Relationship Movie" for a couple.

Here are their memories in order:
${memorySummary}

Create a beautiful movie script with exactly ${memories.length} chapters (one per memory). 
For each chapter return a JSON object with:
- "chapterTitle": a poetic short title (max 5 words)
- "narration": a romantic 2-sentence narration for this moment
- "mood": one of: romantic, nostalgic, joyful, tender, magical
- "musicSuggestion": a real song name + artist that fits this moment's mood

Return ONLY a valid JSON array, no markdown, no explanation. Example format:
[{"chapterTitle":"...","narration":"...","mood":"romantic","musicSuggestion":"Perfect - Ed Sheeran"}]`;

  const callAI = async (systemMsg, userMsg) => {
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }],
          max_tokens: 1200,
          temperature: 0.85,
        });
        return response.choices[0].message.content;
      } catch (e) { console.error('OpenAI movie error:', e.message); }
    }
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: systemMsg });
        const result = await model.generateContent(userMsg);
        return result.response.text();
      } catch (e) { console.error('Gemini movie error:', e.message); }
    }
    return null;
  };

  try {
    const raw = await callAI('You are a romantic cinematic storyteller. Always respond with valid JSON only.', prompt);
    if (!raw) throw new Error('No AI response');

    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const chapters = JSON.parse(cleaned);

    // Merge chapters with original memory data
    const movie = memories.map((mem, i) => ({
      ...chapters[i],
      memory: mem,
      index: i,
    }));

    return res.json({ movie });
  } catch (err) {
    console.error('Movie generation error:', err.message);
    // Fallback: generate basic chapters without AI
    const movie = memories.map((mem, i) => ({
      chapterTitle: mem.title,
      narration: mem.description || 'A beautiful moment captured in time.',
      mood: 'romantic',
      musicSuggestion: 'Perfect - Ed Sheeran',
      memory: mem,
      index: i,
    }));
    return res.json({ movie, fallback: true });
  }
};

module.exports = {
  askLoveAssistant,
  generateMovie,
};
