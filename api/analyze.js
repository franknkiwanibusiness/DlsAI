import Groq from "groq-sdk";

export default async function handler(req, res) {
  // 1. SETUP & CONFIG
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { home, away, league, sport_key } = req.query; 
  const ODDS_API_KEY = '10257181b61bdaba7ac4ca4e276c9dae';
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  try {
    // 2. FETCH LIVE ODDS (The "Target" data)
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sport_key}/odds/?apiKey=${ODDS_API_KEY}&regions=uk,us&markets=h2h,totals&oddsFormat=decimal`;
    const oddsRes = await fetch(oddsUrl);
    const oddsData = await oddsRes.json();

    // Find specific match and extract the best (lowest) odds as the "Surest" market
    const match = oddsData.find(m => m.home_team.includes(home) || m.away_team.includes(away));
    if (!match) throw new Error("Match not found in live markets");

    const bookmaker = match.bookmakers[0];
    const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
    
    // Calculate Implied Probabilities from Bookie
    const bookieAnalysis = h2hMarket.outcomes.map(o => ({
      name: o.name,
      odds: o.price,
      implied_prob: ((1 / o.price) * 100).toFixed(2) + "%"
    }));

    // 3. AI PROMPT WITH LIVE MARKET INJECTION
    const systemPrompt = `
    [ROLE: QUANTITATIVE SPORTS TRADER]
    [DATE: Feb 28, 2026]
    FIXTURE: ${home} vs ${away} (${league})
    
    LIVE MARKET DATA:
    ${JSON.stringify(bookieAnalysis)}

    TASK:
    1. Analyze injury leaks and tactical heatmaps for these teams.
    2. Identify if the Bookie's "implied probability" is WRONG.
    3. Calculate TRUE probability. If True Prob > Implied Prob, it's a +EV bet.

    OUTPUT JSON:
    {
      "market_snapshot": { "favorite": "${bookieAnalysis[0].name}", "bookie_prob": "${bookieAnalysis[0].implied_prob}" },
      "ai_calculations": { "true_home_win_prob": "X%", "true_away_win_prob": "X%", "value_gap": "X%" },
      "verdict": "Strong Buy / Avoid",
      "best_bet": { "selection": "Name", "odds": 0.00, "expected_value": "+X.XX%" }
    }`;

    // 4. RUN ENSEMBLE (Groq + Gemini)
    const [groqRes, geminiRes] = await Promise.all([
      groq.chat.completions.create({
        messages: [{ role: "system", content: systemPrompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + " Return raw JSON only." }] }] })
      }).then(r => r.json())
    ]);

    // 5. MERGE & RESPOND
    const prediction = JSON.parse(groqRes.choices[0].message.content);
    
    res.status(200).json({
      timestamp: new Date().toISOString(),
      match: `${home} vs ${away}`,
      bookie_data: bookieAnalysis,
      ai_insight: prediction,
      disclaimer: "For analytical purposes only."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Data Fetch/Processing Failed", details: error.message });
  }
}
