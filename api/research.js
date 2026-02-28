import { Groq } from "groq-sdk";

// Initialize Groq with your API Key from Vercel Environment Variables
const groq = new Groq({
    apiKey: process.env.EASYBET_API_KEY
});

export default async function handler(req, res) {
    // 1. Setup CORS so your frontend can talk to this API
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { home, away } = req.body;

    try {
        // 2. The Smart Analysis Prompt
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a pro football analyst. Use 2026 team data. Provide sharp, realistic betting insights."
                },
                {
                    role: "user",
                    content: `Analyze the match: ${home} vs ${away}. 
                    Return ONLY a JSON object with these keys:
                    "h2h": (Winner name or Draw),
                    "btts": (Yes/No),
                    "goals": (Over/Under 2.5),
                    "corners": (Estimated range, e.g., "8-10"),
                    "reason": (A witty 1-sentence tactical explanation).`
                }
            ],
            model: "llama3-8b-8192",
            response_format: { type: "json_object" }
        });

        const aiOutput = JSON.parse(chatCompletion.choices[0].message.content);
        
        // 3. Send the data back to your frontend
        res.status(200).json(aiOutput);

    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ 
            h2h: "N/A", btts: "N/A", goals: "N/A", corners: "N/A",
            reason: "AI Researcher had a red card. Try again." 
        });
    }
}
