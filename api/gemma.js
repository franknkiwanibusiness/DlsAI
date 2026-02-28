import { Groq } from "groq-sdk";
const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
    const { home, away, groq_suggestion } = req.body;

    try {
        const chat = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a fast, 1-sentence tactical auditor. Return ONLY JSON." },
                { role: "user", content: `Audit: ${home} vs ${away}. Analyst says: ${groq_suggestion.pick}. Agree? JSON: {"decision":"AGREE/DISAGREE","confidence":80,"audit_reason":"reason"}` }
            ],
            // Llama-3-8b is 5x faster than Mixtral and perfect for a quick audit
            model: "llama3-8b-8192", 
            temperature: 0, 
            response_format: { type: "json_object" }
        });

        res.status(200).json(JSON.parse(chat.choices[0].message.content));
    } catch (e) {
        res.status(200).json({ decision: "DISAGREE", confidence: 0, audit_reason: "Speed Timeout" });
    }
}
