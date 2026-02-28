import { Groq } from "groq-sdk";
const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
    const { home, away, groq_suggestion } = req.body;

    try {
        const chat = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are the Final Auditor. Compare prediction to tactical form. JSON ONLY." },
                { role: "user", content: `Audit: ${home} vs ${away}. Analyst says: ${groq_suggestion.pick}. 
                Is this safe? Return JSON: {"decision": "AGREE/DISAGREE", "confidence": 0-100, "audit_reason": "12 words max"}` }
            ],
            model: "llama-3.3-70b-versatile", // SAME MODEL
            temperature: 0, 
            response_format: { type: "json_object" }
        });
        res.status(200).json(JSON.parse(chat.choices[0].message.content));
    } catch (e) {
        res.status(200).json({ decision: "DISAGREE", confidence: 0, audit_reason: "Safe Veto: Auditor was too slow." });
    }
}
