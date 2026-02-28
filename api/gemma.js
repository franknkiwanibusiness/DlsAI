import { Groq } from "groq-sdk";
const groq = new Groq({ apiKey: process.env.EASYBET_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
    const { home, away, groq_suggestion, odds } = req.body;

    try {
        const chat = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: "You are a Betting Quant. Calculate Fair Value by removing bookmaker overround." 
                },
                { 
                    role: "user", 
                    content: `
                    MATCH: ${home} vs ${away}
                    AI RESEARCH PROBABILITY: ${groq_suggestion.confidence}%
                    BOOKIE ODDS: ${odds}

                    INSTRUCTIONS:
                    1. Implied Prob = (1 / ${odds}) * 100.
                    2. Fair Market Prob = Implied Prob / 1.05 (Assuming 5% average vig).
                    3. Calculate Edge = AI Research Prob - Fair Market Prob.
                    4. A 'Value Bet' must have an Edge > 8%.
                    
                    Return ONLY JSON:
                    {
                        "final_prob": 0-100,
                        "is_value": true/false,
                        "edge": "percentage",
                        "verdict": "12-word mathematical justification"
                    }`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0, // Keep math consistent
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(chat.choices[0].message.content);
        res.status(200).json(result);
    } catch (e) {
        res.status(200).json({ 
            final_prob: 50, 
            is_value: false, 
            verdict: "Math engine timed out. Prediction unverified." 
        });
    }
}
