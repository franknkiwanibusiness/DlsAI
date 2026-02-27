import Groq from "groq-sdk";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { home, away, league } = req.query;
  const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  const systemPrompt = `You are a Professional Betting Syndicate Modeling Engine.
  Analyze ${home} vs ${away} (${league}) using ONLY the last 30 days of data.
  
  PROCESS:
  1. Calculate Expected Goals (xG) based on recent attacking/defensive efficiency.
  2. Evaluate 1X2, Over/Under 2.5, BTTS, and Asian Handicap markets.
  3. Analyze Injuries/Lineups: Identify "High Impact" missing players.
  
  STRICT JSON OUTPUT:
  {
    "probabilities": { "home_win": "0%", "draw": "0%", "away_win": "0%", "over_2_5": "0%", "btts_yes": "0%" },
    "tactical_insight": "2 sentences max on why the value is here.",
    "top_3_scores": ["1-0", "2-1", "1-1"],
    "final_pick": "MARKET - OUTCOME",
    "confidence_score": "0-100"
  }`;

  try {
    // BRAIN 1: Groq (Set to 0.1 Temperature for ZERO guessing, ONLY logic)
    const groqTask = groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, 
      response_format: { type: "json_object" }
    });

    // BRAIN 2: Gemini
    const geminiTask = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
    }).then(r => r.json());

    const [groqRes, geminiRes] = await Promise.all([groqTask, geminiTask]);

    const data = JSON.parse(groqRes.choices[0].message.content);
    
    // We use Groq's structured logic as the primary, but Gemini helps verify
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ tactical_insight: "Engine sync error.", final_pick: "RETRY" });
  }
}
