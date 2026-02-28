import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
    const { home, away, groq_suggestion } = req.body;

    try {
        // Correct 2026 Model ID for the most powerful Gemma
        const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });
        
        const prompt = `You are the Gemma-3 Research Engine. 
        AUDIT DATA: ${home} vs ${away}.
        ANALYST SUGGESTION: ${JSON.stringify(groq_suggestion)}.

        CRITICAL INSTRUCTIONS:
        1. Conduct a tactical 30-day form audit.
        2. If the suggestion (e.g. Over 2.5) contradicts defensive stats, set decision to 'DISAGREE'.
        3. Only 'AGREE' if confidence > 75%.
        
        RESPONSE RULE: Return ONLY a raw JSON object. No markdown, no backticks, no intro text.
        {
          "decision": "AGREE" or "DISAGREE",
          "confidence": 75,
          "audit_reason": "15-word tactical fact"
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        // FAIL-SAFE: Remove markdown backticks if Gemma includes them
        if (text.includes("```")) {
            text = text.split(/```(?:json)?/)[1].split("```")[0].trim();
        }

        res.status(200).json(JSON.parse(text));
    } catch (e) {
        console.error("Gemma Error:", e);
        // Fallback so the frontend doesn't just hang
        res.status(200).json({ 
            decision: "DISAGREE", 
            confidence: 0, 
            audit_reason: "Audit engine busy. Match marked as High Risk." 
        });
    }
}
