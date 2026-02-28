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
                  content: "You are a Betting Quant. Your job is to calculate 'Fair Value'. " +
                           "Compare AI probability vs Bookmaker Fair Probability (Odds with Vig removed)." 
                },
                { 
                  role: "user", 
                  content: `
                  Match: ${home} vs ${away}
                  AI Prediction: ${groq_suggestion.pick} at ${groq_suggestion.confidence}%
                  Bookie Odds for this pick: ${odds}
                  
                  TASK: 
                  1. Calculate Implied Prob: (1 / ${odds}) * 100.
                  2. Subtract estimated 5% Vig to get 'Fair Market Prob'.
                  3. If AI confidence (${groq_suggestion.confidence}%) is > Fair Market Prob + 10%, it is a VALUE BET.
                  4. Adjust the final result to be realistic (no 99% wins).
                  
                  Return JSON: {"final_prob": 0-100, "is_value": true/false, "verdict": "15-word math reason"}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        res.status(200).json(JSON.parse(chat.choices[0].message.content));
    } catch (e) {
        res.status(200).json({ final_prob: 50, is_value: false, verdict: "Math calculation failed." });
    }
}
