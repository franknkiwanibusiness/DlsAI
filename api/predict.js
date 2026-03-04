// /api/predict.js
export default async function handler(req, res) {
    const { research, calculations, home_team, away_team } = req.body;

    const prompt = `You are THE FINAL BOSS. Today is March 4, 2026.
    RESEARCH: ${research}
    QUANT AUDIT: ${calculations}
    
    STRICT LOGIC:
    - If the Quant flagged "HIGH MARGIN RISK" for the winner, AVOID that market.
    - Pivot to a safer play based on facts (e.g., "Chelsea have high goal potential but no Neto, go for Over 1.5 Chelsea Goals").
    - Combine Research + Math for a lethal 2-sentence verdict.
    
    Output: **Bold the Final Market Pick**.`;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ 
                model: "llama-3.3-70b-versatile", 
                messages: [{ role: "user", content: prompt }] 
            })
        });

        const data = await response.json();
        return res.status(200).json({ prediction: data.choices[0].message.content });
    } catch (e) {
        return res.status(500).json({ error: "Final Boss Failed" });
    }
}
