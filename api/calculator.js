// /api/calculator.js
export default async function handler(req, res) {
    const { research, odds, home_team, away_team } = req.body;
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';

    const prompt = `You are THE QUANT. 
    1. Strip Bookmaker Margin from odds: H:${odds.h}, D:${odds.d}, A:${odds.a}.
    2. Adjust probabilities based on RESEARCH: ${research}. 
    3. If margin is high or research contradicts the odds, flag as "HIGH RISK TRAP".`;

    try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "gemma2-9b-it", messages: [{ role: "user", content: prompt }] })
        });
        const data = await groqRes.json();
        const math = data.choices[0].message.content;

        // Automatically pass to Stage 3
        const finalStage = await fetch(`${protocol}://${host}/api/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ research, calculations: math, home_team, away_team })
        });
        return res.status(200).json(await finalStage.json());
    } catch (e) { return res.status(500).json({ error: "Stage 2 Failed" }); }
}
