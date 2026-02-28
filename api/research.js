import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

    try {
        const { home, away } = req.body;

        const chat = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a football data bot. Return ONLY valid JSON." },
                { role: "user", content: `Predict ${home} vs ${away}. Return JSON: {"h2h": "Winner Name", "btts": "Yes/No", "goals": "Over/Under 2.5", "corners": "8-11", "reason": "15 word tactic explanation"}` }
            ],
            // FIXED: Using the new supported model
            model: "llama-3.3-70b-versatile", 
            response_format: { type: "json_object" }
        });

        const content = chat.choices[0].message.content;
        res.status(200).json(JSON.parse(content));

    } catch (e) {
        console.error("BRIDGE ERROR:", e.message);
        res.status(500).json({ 
            h2h: "N/A", btts: "N/A", goals: "N/A", corners: "N/A", 
            reason: "AI Model Error: " + e.message 
        });
    }
}
