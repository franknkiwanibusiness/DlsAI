import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { home, away } = req.body;

        const chat = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: `You are a Lead Football Analyst for a pro betting syndicate. 
                    Simulate a deep-dive search of the last 30 days of 2026 match data. 
                    Focus on: xG, defensive blocks, wing-play (for corners), and clinical finishing.
                    STRICT: Return ONLY valid JSON. Avoid generic "safe" picks if data suggests otherwise.` 
                },
                { 
                    role: "user", 
                    content: `COMPREHENSIVE ANALYSIS: ${home} vs ${away}. 
                    Evaluate these specific markets and return the HIGHEST PROBABILITY / LOWEST RISK option for each:
                    1. h2h: (1, 2, X, 1X, 2X, or 12).
                    2. btts: (Yes/No).
                    3. goals: (Over 1.5, 2.5, 3.5 OR Under 2.5, 3.5).
                    4. corners: (Over 6.5, 7.5 OR Under 10.5, 11.5, 12.5).
                    5. first_half_goals: (Over 0.5, 1.5 OR Under 1.5).
                    6. first_score: (Which team scores first).
                    7. highest_half: (1st Half, 2nd Half, or Equal).
                    8. reason: A 15-word tactical reason citing 2026 form.

                    Return JSON: {"h2h":"","btts":"","goals":"","corners":"","fh_goals":"","first_score":"","highest_half":"","reason":""}`
                }
            ],
            model: "llama-3.3-70b-versatile", 
            temperature: 0.6, // Balanced for precision and deep research
            response_format: { type: "json_object" }
        });

        res.status(200).json(JSON.parse(chat.choices[0].message.content));

    } catch (e) {
        res.status(500).json({ error: "Bridge crash: " + e.message });
    }
}
