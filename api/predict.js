// /api/predict.js
export default async function handler(req, res) {
    const { research, calculations } = req.body;
    const prompt = `You are THE FINAL BOSS. Today is March 4, 2026.
    If the QUANT math shows "HIGH RISK TRAP" for the 1X2 market, PIVOT to a safer market (Corners, BTTS, or Over/Under).
    Use RESEARCH: ${research} to justify the pivot. Output 2 sentences. **Bold the Market Pick**.`;

    try {
        const resGroq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] })
        });
        const data = await resGroq.json();
        return res.status(200).json({ prediction: data.choices[0].message.content });
    } catch (e) { return res.status(500).json({ error: "Stage 3 Failed" }); }
}
