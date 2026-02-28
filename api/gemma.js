import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
    const { home, away, groq_suggestion } = req.body;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `AUDIT TASK: Research ${home} vs ${away} (Feb/March 2026).
        The Analyst suggested: ${JSON.stringify(groq_suggestion)}.
        
        CRITERIA:
        1. If teams are defensively strong, VETO 'Over 2.5' or 'BTTS Yes'.
        2. If 30-day form is inconsistent, set decision to 'DISAGREE'.
        3. Confidence must be >75% for 'AGREE'.
        
        Return ONLY JSON: 
        {"decision": "AGREE" or "DISAGREE", "confidence": 0-100, "audit_reason": "15-word tactical fact"}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, "").trim();
        
        res.status(200).json(JSON.parse(text));
    } catch (e) {
        res.status(500).json({ error: "Audit Failed: " + e.message });
    }
}
