import Groq from "groq-sdk";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { home, away, league } = req.query;
  const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  const entropy = Date.now();

  const systemPrompt = `
  [SYSTEM ROLE: ELITE SPORTS QUANT & TACTICAL SCOUT]
  [MODE: 24/7 DEEP RESEARCH - NO DEFAULTS]
  [DATE: Feb 27, 2026]

  LEAGUE CONTEXT: ${league}
  FIXTURE: ${home} (Home) vs ${away} (Away)

  YOUR DIRECTIVE:
  You have just completed a 24-hour deep-dive into:
  1. Official Injury Lists & Training Ground "Leaks" (Check: Kevin at Fulham, Estevao at Chelsea, Mbappe at Real Madrid).
  2. Tactical Heatmaps from the last 5 matches (Past 30 days).
  3. Poisson Distribution Models for score probabilities.
  4. Market Sentiment & Line Movement analysis.

  STRICT ANALYTICAL REQUIREMENTS:
  - INDIVIDUAL xG: Calculate projected goals for ${home} and ${away} separately based on defensive absences.
  - MARKET ARBITRAGE: Identify the most "Mispriced" market (H2H, BTTS, Corners, or Asian Handicap).
  - FORBIDDEN RESPONSES: Do not provide "2-1" or "Over 2.5" unless your calculated xG exceeds 2.85.
  - LINEUP IMPACT: If a key playmaker is out, reduce the "Attacking Power" score by 25%.

  OUTPUT JSON STRUCTURE:
  {
    "research_logs": {
      "injuries": "Detailed status of key players for both sides",
      "tactics": "How ${home}'s press will interact with ${away}'s buildup",
      "form_30d": "Win/Loss/xG metrics for the last month"
    },
    "probabilities": {
      "home_win": "X%", "draw": "X%", "away_win": "X%",
      "over_2_5": "X%", "under_2_5": "X%", "btts_yes": "X%"
    },
    "market_analysis": {
      "primary_pick": "The safest bet",
      "value_longshot": "Higher risk, high reward pick",
      "top_3_scores": ["S1", "S2", "S3"]
    },
    "confidence_score": 0-100,
    "verdict": "One sentence "Strong Buy" or "Avoid" advice",
    "entropy_id": "${entropy}"
  }`;

  try {
    // RUN THE QUANTUM LOGIC ENGINE (Groq)
    const groqTask = groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // Near-zero for purely mathematical consistency
      response_format: { type: "json_object" }
    });

    // RUN THE LINGUISTIC RESEARCH ENGINE (Gemini)
    const geminiTask = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + " Return only raw JSON." }] }] })
    }).then(r => r.json());

    const [groqRes, geminiRes] = await Promise.all([groqTask, geminiTask]);
    
    // Final Data Construction
    const finalData = JSON.parse(groqRes.choices[0].message.content);
    res.status(200).json(finalData);

  } catch (error) {
    res.status(500).json({ verdict: "RETRY: Engine Overload", confidence_score: 0 });
  }
}
