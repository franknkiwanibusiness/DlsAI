import Groq from "groq-sdk";
import admin from "firebase-admin";

// [REUSE YOUR FIREBASE ADMIN INITIALIZATION CODE HERE]

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { home, away, league, sport = 'soccer_epl' } = req.query;
  const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const ODDS_API_KEY = '10257181b61bdaba7ac4ca4e276c9dae';

  try {
    // 1. DATA ACQUISITION
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${ODDS_API_KEY}&regions=uk&markets=h2h,totals&oddsFormat=decimal`;
    const oddsRes = await fetch(oddsUrl);
    const oddsData = await oddsRes.json();

    const match = oddsData.find(m => 
      m.home_team.toLowerCase().includes(home.toLowerCase().split(' ')[0]) || 
      m.away_team.toLowerCase().includes(away.toLowerCase().split(' ')[0])
    );

    const snapshot = match ? match.bookmakers[0].markets : "Tactical Analysis Only";

    // 2. THE ANALYTICAL COMMAND (Hoyoo AI Brain Core)
    const systemPrompt = `
    [SYSTEM ROLE: HOYOO AI - QUANTUM ANALYST]
    [DATE: Feb 28, 2026]
    FIXTURE: ${home} vs ${away} (${league})

    BOOKMAKER SNAPSHOT: ${JSON.stringify(snapshot)}

    ANALYSIS PROTOCOL:
    1. CALCULATE IMPLIED PROBABILITY: $P_{implied} = \frac{1}{Odds}$
    2. TACTICAL FILTER: Evaluate "High Pressing" vs "Low Block" profiles.
    3. MOMENTUM SCORING: Factor in 24-hour injury reports and midweek fatigue.
    4. EV FORMULA: $EV = (AI\_Prob \times Odds) - 1$.
    
    MARKET DIRECTIVE: 
    Evaluate 10 markets (1X2, AH, DNB, BTTS, O/U 2.5, O/U 1.5, Double Chance, Corners, Team Totals, Winning Margin). 
    Pivot to the market with the HIGHEST EV.

    RETURN JSON ONLY:
    {
      "brain_thoughts": {
        "tactical_mismatch": "Specific reason for the edge",
        "momentum_score": "Scale 1-10",
        "cleverness_logic": "Why Hoyoo AI is picking this"
      },
      "market_analysis": {
        "best_value_market": "Market Name",
        "primary_pick": "Outcome",
        "ev_edge": "+X.XX%",
        "top_3_scores": ["1-1", "2-1", "1-0"]
      },
      "probabilities": {"home": "X%", "draw": "X%", "away": "X%", "o2_5": "X%"},
      "confidence_score": 0-100,
      "verdict": "Final summary"
    }`;

    // 3. DUAL-LLM EXECUTION
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

    const [groqRes] = await Promise.all([groqTask, geminiTask]);
    const finalData = JSON.parse(groqRes.choices[0].message.content);

    // 4. FIREBASE LOGGING (Feeding the Cleverness Engine)
    await db.ref('scout_history').push({
      home, away, league,
      pick: finalData.market_analysis.primary_pick,
      market: finalData.market_analysis.best_value_market,
      ev: finalData.market_analysis.ev_edge,
      status: 'pending',
      timestamp: admin.database.ServerValue.TIMESTAMP
    });

    res.status(200).json(finalData);

  } catch (error) {
    res.status(500).json({ verdict: "Brain Disconnected", confidence_score: 0 });
  }
}
