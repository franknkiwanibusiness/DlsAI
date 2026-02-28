import { Groq } from "groq-sdk";
const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    const { home, away, groq_suggestion } = req.body;
    try {
        const chat = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are the Tactical Auditor. Your job is to VETO risky bets." },
                { role: "user", content: `Audit this: ${home} vs ${away}. Analyst suggests: ${JSON.stringify(groq_suggestion)}. 
                If the 30-day form is too inconsistent for this pick, DISAGREE. 
                Return JSON: {"decision": "AGREE/DISAGREE", "confidence": 0-100, "audit_reason": "15-word max"}` }
            ],
            // Using a different model for a "second opinion"
            model: "mixtral-8x7b-32768", 
            response_format: { type: "json_object" }
        });
        res.status(200).json(JSON.parse(chat.choices[0].message.content));
    } catch (e) { res.status(500).json({ error: e.message }); }
}
