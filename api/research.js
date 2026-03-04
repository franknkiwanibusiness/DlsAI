// /api/research.js
export default async function handler(req, res) {
    const { home_team, away_team, sport_title, odds } = req.body;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Today is March 4, 2026. SEARCH LIVE: ${home_team} vs ${away_team}. 
                Find: 1. 2026 Table (Arsenal 1st, Villa 4th, Chelsea 6th). 
                2. Status of John McGinn, Pedro Neto (Suspension), and Chelsea Manager Liam Rosenior. 
                3. Last 3 results in Feb/March 2026. Return facts only.` }] }],
                tools: [{ googleSearch: {} }]
            })
        });

        const data = await response.json();
        const facts = data.candidates[0].content.parts[0].text;

        // CHAIN TO CALCULATOR
        const calcRes = await fetch(`${protocol}://${host}/api/calculator`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ research: facts, odds, home_team, away_team })
        });

        const finalOutput = await calcRes.json();
        return res.status(200).json(finalOutput);
    } catch (e) {
        return res.status(500).json({ error: "Stage 1 Failed" });
    }
}
