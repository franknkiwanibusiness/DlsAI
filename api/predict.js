export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ prediction: "POST only" });

    const { home_team, away_team, odds } = req.body;

    try {
        const groq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{
                    role: "system",
                    content: "Professional betting analyst. 1 sentence max. No fluff. Give a sharp value tip based on odds provided."
                }, {
                    role: "user",
                    content: `${home_team} vs ${away_team}. Odds: H:${odds.h}, D:${odds.d}, A:${odds.a}`
                }]
            })
        });

        const data = await groq.json();
        return res.status(200).json({ prediction: data.choices[0].message.content });
    } catch (e) {
        return res.status(500).json({ prediction: "AI analysis server error." });
    }
}
