import { Groq } from "groq-sdk";

// Initialize Groq with your API Key
const groq = new Groq({
    apiKey: process.env.EASYBET_API_KEY
});

export default async function handler(req, res) {
    // 1. Handle Preflight CORS (Required for mobile/external access)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { home, away } = req.body;

    try {
        // 2. The Multi-Market Prompt
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a professional football data analyst. Analyze matches based on current 2026 form, xG, and tactical trends."
                },
                {
                    role: "user",
                    content: `Analyze ${home} vs ${away}. Predict the following and return ONLY a JSON object: 
                    1. h2h (The winner or 'Draw')
                    2. btts ('Yes' or 'No')
                    3. goals (Over or Under 2.5)
                    4. corners (Predicted number range)
                    5. reason (A sharp 15-word tactical explanation).`
                }
            ],
            model: "llama3-8b-8192",
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(chatCompletion.choices[0].message.content);
        
        // 3. Return the researched data to your frontend
        res.status(200).json(result);

    } catch (error) {
        console.error("Groq Error:", error);
        res.status(500).json({ 
            h2h: "N/A", 
            btts: "N/A", 
            goals: "N/A", 
            corners: "N/A", 
            reason: "AI Researcher is currently in the locker room." 
        });
    }
}
