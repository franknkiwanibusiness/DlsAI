import { Groq } from "groq-sdk";
const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
    const { home, away, groq_suggestion } = req.body;

    try {
        const chat = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a Football Auditor. You must return ONLY JSON." },
                { role: "user", content: `Audit this: ${home} vs ${away}. 
                Analyst Suggestion: ${JSON.stringify(groq_suggestion)}. 
                Verify if this is safe. 
                Return EXACT JSON: {"decision": "AGREE" or "DISAGREE", "confidence": 85, "audit_reason": "text here"}` }
            ],
            model: "mixtral-8x7b-32768", // Using Mixtral as the second brain
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(chat.choices[0].message.content);
        res.status(200).json(result);
    } catch (e) {
        // If it fails, send a "Safe" fallback so the frontend doesn't show undefined
        res.status(200).json({ 
            decision: "DISAGREE", 
            confidence: 0, 
            audit_reason: "API Connection Timeout" 
        });
    }
}
