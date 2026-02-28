import { Groq } from "groq-sdk";
const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
    const { home, away } = req.body;
    try {
        const chat = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: `You are a 2026 Football Data Analyst. 
                    STRICT RULES:
                    1. Never default to 'Over 2.5' or 'BTTS Yes'. If teams are low-scoring (e.g., Serie A or La Liga bottom-half), predict 'Under'.
                    2. Evaluate Double Chance (1X, 2X) for high-risk games.
                    3. Calculate a specific 'Confidence Percentage' (0-100) for each pick.
                    4. Return ONLY valid JSON with the EXACT keys requested.`
                },
                { 
                    role: "user", 
                    content: `Analyze ${home} vs ${away} for Feb 28 - March 1, 2026 fixtures. 
                    Return this EXACT JSON structure:
                    {
                      "pick": "1, 2, X, 1X, or 2X",
                      "pick_pct": 75,
                      "goals": "Over/Under 1.5/2.5/3.5",
                      "goals_pct": 60,
                      "corners": "Over/Under 8.5/9.5/10.5",
                      "corners_pct": 55,
                      "btts": "Yes/No",
                      "btts_pct": 50,
                      "fh_goals": "Over 0.5 or Under 1.5",
                      "first_score": "Home, Away, or None",
                      "reason": "Technical 15-word reason using 2026 form."
                    }` 
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5, // Lower temperature = more factual, less 'creative' guessing
            response_format: { type: "json_object" }
        });
        res.status(200).json(JSON.parse(chat.choices[0].message.content));
    } catch (e) { res.status(500).json({ error: "Bridge Error: " + e.message }); }
}
