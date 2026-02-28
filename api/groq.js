import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
    const { home, away } = req.body;

    try {
        const chat = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Expert Football Analyst. Return ONLY JSON." },
                { role: "user", content: `Analyze ${home} vs ${away}. 
                    Provide: pick (1, 2, X, 1X, 2X, 12), goals (O/U 2.5), btts (Yes/No), corners (O/U 9.5). 
                    Format: {"pick":"","goals":"","btts":"","corners":""}` }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        res.status(200).json(JSON.parse(chat.choices[0].message.content));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
