// /api/calculator.js
export default async function handler(req, res) {
    const { research, odds, home_team, away_team } = req.body;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;

    const prompt = `You are THE QUANT. 
    1. Calculate Implied Prob for Odds: H:${odds.h}, D:${odds.d}, A:${odds.a}.
    2. Remove the Margin (Vig) to find the Fair Probability.
    3. Adjust math based on RESEARCH: ${research}. (e.g., If Neto is suspended, Chelsea's True Chance drops).
    4. If the Bookie's Margin is high or research contradicts the odds, label this "HIGH MARGIN RISK".
    Return the math breakdown and risk level.`;

    try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "gemma-3-27b-it", messages: [{ role: "user", content: prompt }] })
        });

        const calcData = await groqRes.json();
        const calculations = calcData.choices[0].message.content;

        // CHAIN TO FINAL PREDICT (THE BOSS)
        const bossRes = await fetch(`${protocol}://${host}/api/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ research, calculations, home_team, away_team })
        });

        const finalVerdict = await bossRes.json();
        return res.status(200).json(finalVerdict);
    } catch (e) {
        return res.status(500).json({ error: "Stage 2 Failed" });
    }
}
