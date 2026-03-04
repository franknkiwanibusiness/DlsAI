// /api/research.js
export default async function handler(req, res) {
    const { home_team, away_team, odds } = req.body;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Today is March 4, 2026. SEARCH LIVE: ${home_team} vs ${away_team}. 
                Find: 1. 2026 Standing/Points (Arsenal 1st, Villa 4th, Chelsea 6th). 
                2. Key Injuries: John McGinn (Villa knee), Pedro Neto (Chelsea suspension), Levi Colwill (ACL).
                3. Chelsea Manager: Confirm Liam Rosenior.
                4. Last 3 scores for both teams in Feb/March 2026.
                Return only raw data bullets.` }] }],
                tools: [{ googleSearch: {} }] 
            })
        });

        const data = await response.json();
        const facts = data.candidates[0].content.parts[0].text;

        // CHAIN TO CALCULATOR
        const nextStage = await fetch(`${protocol}://${host}/api/calculator`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ research: facts, odds, home_team, away_team })
        });

        const result = await nextStage.json();
        return res.status(200).json(result);
    } catch (e) {
        return res.status(500).json({ error: "Research Stage Failed" });
    }
}
