// /api/calculator.js
export default async function handler(req, res) {
    const { research, odds, home_team, away_team } = req.body;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;

    const prompt = `You are THE QUANT. 
    1. Calculate Implied Prob for Odds: H:${odds.h}, D:${odds.d}, A:${odds.a}.
    2. Strip the Bookmaker Margin to find the 'Fair Probability'.
    3. FACTOR IN RESEARCH: ${research}. 
       Example: If Pedro Neto (Chelsea) is suspended, drop Chelsea's win probability by 10%. 
       If John McGinn is out, drop Villa's control rating.
    4. Label as "HIGH MARGIN RISK" if the fair probability is much lower than the bookie's odds.
    
    Return math breakdown and risk level.`;

    try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ 
                model: "gemma2-9b-it", // Gemma 27b/9b on Groq for math
                messages: [{ role: "user", content: prompt }],
                temperature: 0
            })
        });

        const data = await groqRes.json();
        const calculations = data.choices[0].message.content;

        // CHAIN TO FINAL AUDIT
        const finalStage = await fetch(`${protocol}://${host}/api/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ research, calculations, home_team, away_team })
        });

        const finalOutput = await finalStage.json();
        return res.status(200).json(finalOutput);
    } catch (e) {
        return res.status(500).json({ error: "Calculation Stage Failed" });
    }
}
