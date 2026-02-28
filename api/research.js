import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    // Enable CORS for mobile access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).send('Use POST');

    const { home, away } = req.body;

    try {
        const chat = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a pro football analyst. Return ONLY JSON." },
                { role: "user", content: `Analyze ${home} vs ${away}. Predict: 1. h2h (Winner), 2. btts (Yes/No), 3. goals (Over/Under 2.5), 4. corners (Expected range), 5. reason (15 words).` }
            ],
            model: "llama3-8b-8192",
            response_format: { type: "json_object" }
        });

        res.status(200).json(JSON.parse(chat.choices[0].message.content));
    } catch (e) {
        res.status(500).json({ error: "Groq is busy." });
    }
}
