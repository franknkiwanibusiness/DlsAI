import { Groq } from "groq-sdk";
const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
    const { home, away, groq_suggestion } = req.body;

    // Use AbortController to kill the request if it hangs too long
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8-second limit

    try {
        const chat = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a fast auditor. JSON ONLY." },
                { role: "user", content: `Audit: ${home} vs ${away}. Suggestion: ${groq_suggestion.pick}. Agree? Format: {"decision":"AGREE/DISAGREE","confidence":80,"audit_reason":"10 words"}` }
            ],
            model: "llama-3-8b-8192", // Fastest model available
            temperature: 0,
            response_format: { type: "json_object" }
        }, { signal: controller.signal });

        clearTimeout(timeout);
        res.status(200).json(JSON.parse(chat.choices[0].message.content));
    } catch (e) {
        res.status(200).json({ 
            decision: "DISAGREE", 
            confidence: 0, 
            audit_reason: "Safe Veto: Analysis took too long." 
        });
    }
}
