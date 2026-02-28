import { Groq } from "groq-sdk";
const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
    const { home, away } = req.body;

    try {
        const chat = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Predict football outcomes. JSON ONLY." },
                { role: "user", content: `Predict ${home} vs ${away}. Markets: pick, goals, btts, corners.` }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        res.status(200).json(JSON.parse(chat.choices[0].message.content));
    } catch (e) {
        res.status(500).json({ error: "Analyst Timeout" });
    }
}
