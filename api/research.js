import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Safety Check
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    // 2. FIXED: Vercel parses req.body automatically. 
    // If it's already an object, don't use JSON.parse()
    const { home, away, league } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!home || !away) {
        return res.status(400).json({ prediction: "Missing match data." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

    // 3. Anime Battle Strategist Prompt
    const prompt = `
      You are a legendary Shonen Anime Battle Strategist. 
      Analyze the "battle" between ${home} and ${away} (${league}).
      Provide:
      - Recommended Market (e.g., BTTS, Over 2.5, Home Win)
      - 1-sentence tactical "battle plan" reason.
      - Confidence: XX%
      Keep it sharp, neat, and under 25 words.
    `;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    // 4. Send clean JSON back
    res.status(200).json({ 
        prediction: text.trim() || "Scout is silent..." 
    });

  } catch (error) {
    console.error("Gemini Error:", error);
    // Always return a JSON object so the frontend doesn't get 'undefined'
    res.status(500).json({ 
        prediction: "Tactical retreat! (AI Limit Hit)" 
    });
  }
}
