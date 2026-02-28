import Groq from "groq-sdk";

export default async function handler(req, res) {
  // 1. Safety Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { home, away, league, sport = 'soccer_epl' } = req.query;
  const ODDS_API_KEY = '10257181b61bdaba7ac4ca4e276c9dae';
  const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  try {
    // 2. Fetch Odds with Safety
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${ODDS_API_KEY}&regions=uk&markets=h2h&oddsFormat=decimal`;
    const oddsRes = await fetch(oddsUrl);
    
    if (!oddsRes.ok) throw new Error("Odds API limit reached or down");
    
    const oddsData = await oddsRes.json();

    // 3. IMPROVED MATCHING (Prevents the crash)
    // Check if team name is partially inside the API response
    const match = oddsData.find(m => 
      m.home_team.toLowerCase().includes(home.toLowerCase().split(' ')[0]) || 
      m.away_team.toLowerCase().includes(away.toLowerCase().split(' ')[0])
    );

    // Safeguard the snapshot: If no match found, provide generic "Fair Odds"
    const marketSnapshot = (match && match.bookmakers && match.bookmakers[0]) 
      ? match.bookmakers[0].markets[0].outcomes 
      : "No live market found. Use historical xG only.";

    const systemPrompt = `
    [SYSTEM ROLE: ELITE SPORTS QUANT]
    [DATE: Feb 28, 2026]
    FIXTURE: ${home} vs ${away} (${league})

    LIVE MARKET DATA:
    ${JSON.stringify(marketSnapshot)}

    YOUR DIRECTIVE:
    1. Identify the 'Banker' outcome.
    2. Calculate Expected Value (EV): (AI_Prob * Bookie_Odds) - 1.
    3. Return UNIQUE scores and 30-day tactical research logs.

    OUTPUT JSON ONLY:
    {
      "research_logs": {"injuries": "...", "tactics": "..."},
      "probabilities": {"home_win": "X%", "draw": "X%", "away_win": "X%", "under_2_5": "X%", "btts_yes": "X%"},
      "market_analysis": {
        "primary_pick": "Market - Outcome",
        "top_3_scores": ["1-0", "2-1", "1-1"]
      },
      "confidence_score": 0,
      "verdict": "One sentence summary"
    }`;

    // 4. DUAL-ENGINE CALL
    const groqTask = groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0, 
      response_format: { type: "json_object" }
    });

    const geminiTask = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
    }).then(r => r.json());

    const [groqRes, geminiRes] = await Promise.all([groqTask, geminiTask]);
    
    // 5. Final Parse & Return
    const finalData = JSON.parse(groqRes.choices[0].message.content);
    res.status(200).json(finalData);

  } catch (error) {
    console.error("CRITICAL BACKEND ERROR:", error.message);
    res.status(500).json({ 
      verdict: "ENGINE TIMEOUT", 
      research_logs: { injuries: "Data feed interrupted.", tactics: "Please retry." },
      market_analysis: { primary_pick: "STAY CLEAR", top_3_scores: ["N/A"] },
      probabilities: { home_win: "0%", draw: "0%", away_win: "0%" },
      confidence_score: 0 
    });
  }
}
