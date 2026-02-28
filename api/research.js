// /api/research.js
import { Groq } from "groq-sdk";

// Initialize Groq with your API Key from Vercel Environment Variables
const groq = new Groq({
    apiKey: process.env.EASYBET_API_KEY
});

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { home, away } = req.body;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert sports analyst. Provide a sharp, concise betting pick (Match Result, BTTS, or Totals) and a 1-sentence witty reason based on team names."
                },
                {
                    role: "user",
                    content: `Analyze: ${home} vs ${away}. Return ONLY a JSON object with keys "pick" and "reason".`
                }
            ],
            model: "llama3-8b-8192", // Fast and efficient for research
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(chatCompletion.choices[0].message.content);
        res.status(200).json(result);
    } catch (error) {
        console.error("Groq Error:", error);
        res.status(500).json({ pick: "No Pick", reason: "The AI is currently off-pitch." });
    }
}
