import { Groq } from "groq-sdk";
const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    const { home, away } = req.body;
    try {
        const chat = await groq.chat.completions.create({
            messages: [{ 
                role: "user", 
                content: `Analyze ${home} vs ${away}. 
                Pick the SINGLE most likely market from: h2h (1X2), totals (Over/Under 2.5), or btts (Both Teams to Score).
                Return JSON ONLY:
                {
                  "market_key": "h2h" | "totals" | "btts",
                  "selection": "Specific outcome like Home, Away, Draw, Over 2.5, Under 2.5, Yes, or No",
                  "confidence": 0-100,
                  "reason": "Short tactical reason"
                }` 
            }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        res.status(200).json(JSON.parse(chat.choices[0].message.content));
    } catch (e) { res.status(500).json({ error: e.message }); }
}
