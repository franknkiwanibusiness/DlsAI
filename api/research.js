import { Groq } from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
    const { home, away } = req.body;

    try {
        // AI BRAIN 1: Groq (The Technical Analyst)
        const groqRes = await groq.chat.completions.create({
            messages: [{ role: "user", content: `Predict ${home} vs ${away}. Return ONLY JSON: {"pick": "1, 2, X, 1X, 2X, or 12", "goals": "O/U 2.5", "btts": "Yes/No"}` }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        const groqData = JSON.parse(groqRes.choices[0].message.content);

        // AI BRAIN 2: Gemini (The 30-Day Auditor)
        const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const geminiPrompt = `Audit this match: ${home} vs ${away}. 
            Check last 30 days form. Groq suggests: ${groqData.pick}. 
            Do you agree? Return JSON: {"pick": "1, 2, X, 1X, 2X, or 12", "confidence": 0-100, "reason": "15 words"}`;
        
        const geminiRes = await geminiModel.generateContent(geminiPrompt);
        const geminiText = geminiRes.response.text().replace(/```json|```/g, "").trim();
        const geminiData = JSON.parse(geminiText);

        // THE VETO LOGIC
        // If picks are different (e.g. Groq says '1' but Gemini says '2X'), we kill the bet.
        const isConflict = groqData.pick !== geminiData.pick;

        res.status(200).json({
            status: isConflict ? "NON-BETTABLE" : "VERIFIED",
            pick: isConflict ? "SKIP" : geminiData.pick,
            confidence: isConflict ? 0 : geminiData.confidence,
            goals: groqData.goals,
            btts: groqData.btts,
            reason: isConflict ? "AI Conflict: Models disagree on the tactical outcome." : geminiData.reason
        });

    } catch (e) {
        res.status(500).json({ status: "ERROR", reason: "Bridge Error: " + e.message });
    }
}
