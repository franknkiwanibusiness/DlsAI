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
                { role: "system", content: "You are a football data bot. Return ONLY valid JSON. No prose, no intro." },
                { role: "user", content: `Predict ${home} vs ${away}. Return JSON: {"h2h": "team", "btts": "Yes/No", "goals": "O/U 2.5", "corners": "range", "reason": "text"}` }
            ],
            model: "llama3-8b-8192",
            response_format: { type: "json_object" }
        });

        // Safe parsing: if AI fails, we send a backup object
        const content = chat.choices[0].message.content;
        res.status(200).json(JSON.parse(content));

    } catch (e) {
        console.error("BRIDGE ERROR:", e.message);
        // This stops the 500 and tells you what happened
        res.status(200).json({ 
            h2h: "Error", btts: "Check Key", goals: "Check Logs", 
            corners: "500", reason: "The AI bridge crashed: " + e.message 
        });
    }
}
