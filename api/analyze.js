import Groq from "groq-sdk";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // 1. EXTRACT PARAMS (Add 'sport' like 'soccer_epl')
  const { home, away, league, sport = 'soccer_epl' } = req.query;
  const ODDS_API_KEY = '10257181b61bdaba7ac4ca4e276c9dae';
  const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  try {
    // 2. FETCH THE "BOOKIE'S TRUTH" (Real-time Odds)
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${ODDS_API_KEY}&regions=uk,us&markets=h2h,totals&oddsFormat=decimal`;
    const oddsRes = await fetch(oddsUrl);
    const oddsData = await oddsRes.json();

    // Find the specific fixture and the "Surest" market (lowest odds)
    const match = oddsData.find(m => m.home_team.includes(home) || m.away_team.includes(away));
    const marketSnapshot = match ? match.bookmakers[0].markets : "No live odds found";

    const systemPrompt = `
    [SYSTEM ROLE: ELITE SPORTS QUANT]
    [DATE: Feb 28, 2026]
    FIXTURE: ${home} vs ${away} (${league})

    LIVE MARKET DATA FROM BOOKMAKERS:
    ${JSON.stringify(marketSnapshot)}

    YOUR DIRECTIVE:
    1. Identify the 'Banker' (the outcome with lowest decimal odds).
    2. Analyze if the AI predicts a HIGHER probability than the bookie's implied probability.
    3. Calculate Expected Value: (AI_Prob * Bookie_Odds) - 1.

    OUTPUT JSON STRUCTURE:
    {
      "bookie_consensus": {
        "implied_favorite": "Name",
        "current_odds": 0.00,
        "implied_win_chance": "X%"
      },
      "ai_analysis": {
        "true_win_probability": "X%",
        "expected_value_roi": "+X%",
        "tactical_edge": "Why the bookie is wrong/right"
      },
      "verdict": "STRONG BUY if EV > 5%, otherwise AVOID",
      "best_market_odds": "Current price of the top pick"
    }`;

    // 3. RUN DUAL-ENGINE ENSEMBLE
    const groqTask = groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const geminiTask = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + " Return only raw JSON." }] }] })
    }).then(r => r.json());

    const [groqRes, geminiRes] = await Promise.all([groqTask, geminiTask]);
    
    // 4. RESPOND WITH THE MERGED DATA
    const finalData = JSON.parse(groqRes.choices[0].message.content);
    res.status(200).json(finalData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ verdict: "RETRY: Connection to Odds API or AI failed", confidence_score: 0 });
  }
}
