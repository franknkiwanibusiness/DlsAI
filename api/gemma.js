import { GoogleGenerativeAI } from "@google/generative-ai";

// Still use your GEMINI_API_KEY from Google AI Studio
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
    const { home, away, groq_suggestion } = req.body;

    try {
        // FORCE THE MODEL TO GEMMA 3 27B
        // This model is optimized for logic and research 
        const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });
        
        const prompt = `You are the Gemma-3 Research Engine. 
        TASK: Audit the following match: ${home} vs ${away}.
        
        The Groq Analyst suggests: ${JSON.stringify(groq_suggestion)}.
        
        Using your 2026 tactical database:
        1. Verify if the 'pick' is statistically sound (check 30-day xG and defensive form).
        2. If Groq says 'BTTS Yes' but one team has failed to score in 3 of their last 4 games, you MUST DISAGREE.
        3. Only AGREE if your confidence is above 75%.

        Return ONLY JSON:
        {
          "decision": "AGREE" or "DISAGREE",
          "confidence": 0-100,
          "audit_reason": "Provide a 15-word tactical fact (e.g., 'Home team 0.4 xG away suggests low scoring match')."
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // Clean the response in case Gemma adds markdown backticks
        const text = response.text().replace(/```json|```/g, "").trim();
        
        res.status(200).json(JSON.parse(text));
    } catch (e) {
        // Fallback to a safe 'Disagree' if the API is overwhelmed
        res.status(200).json({ 
            decision: "DISAGREE", 
            confidence: 0, 
            audit_reason: "Gemma Engine Timeout - Fixture marked risky." 
        });
    }
}
