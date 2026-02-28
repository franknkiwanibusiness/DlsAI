import { Groq } from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
    const { home, away } = req.body;

    try {
        // BRAIN 1: Groq (Llama 3.3 70B) - Generates the technical markets
        const groqChat = await groq.chat.completions.create({
            messages: [{ role: "user", content: `Predict ${home} vs ${away} markets: pick, goals, corners, btts. Return JSON.` }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        // BRAIN 2: Gemini (Gemma-mode) - Performs the "Deep Search" Audit
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Perform a 30-day tactical audit for ${home} vs ${away}. 
                        If the teams have low xG, suggest 'Under'. 
                        Verify these markets: ${groqChat.choices[0].message.content}. 
                        Return final corrected JSON with pick_pct, goals_pct, etc.`;
        
        const geminiResult = await model.generateContent(prompt);
        const finalData = geminiResult.response.text().replace(/```json|```/g, "");

        res.status(200).json(JSON.parse(finalData));
    } catch (e) {
        res.status(500).json({ error: "Dual-Brain Error: " + e.message });
    }
}
