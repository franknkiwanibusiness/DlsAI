// /api/research.js
export default async function handler(req, res) {
    const { home_team, away_team, odds } = req.body;
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Today is March 4, 2026. SEARCH: ${home_team} vs ${away_team}. 
                Find: 1. 2026 Table (Arsenal 1st, Villa 4th, Chelsea 6th). 
                2. Injuries: John McGinn (Villa knee), Pedro Neto (Chelsea suspension), Chelsea manager Liam Rosenior.
                3. Last 3 results for both. Return facts only.` }] }],
                tools: [{ googleSearch: {} }] 
            })
        });
        const data = await response.json();
        const facts = data.candidates[0].content.parts[0].text;

        // Automatically pass data to Stage 2
        const next = await fetch(`${protocol}://${host}/api/calculator`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ research: facts, odds, home_team, away_team })
        });
        const final = await next.json();
        return res.status(200).json(final);
    } catch (e) { return res.status(500).json({ error: "Stage 1 Failed" }); }
}
