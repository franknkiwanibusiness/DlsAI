// /api/predict.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { home_team, away_team, odds, sport_title } = req.body;

    try {
        const groq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // Or your search-enabled model
                messages: [
                    {
                        role: "system",
                        content: `You are a professional Betting Scout. 
                        Perform a Deep Research analysis on BOTH teams:
                        1. SEARCH: Injuries & Lineups for the last 48 hours.
                        2. FORM: Past 30 days performance.
                        3. SPLITS: ${home_team}'s Home Record vs ${away_team}'s Away Record.
                        4. TABLE: Current positions and Goal Difference (GD).
                        5. UEFA: If '${sport_title}' is a UEFA comp, check their history against foreign clubs.
                        6. VERDICT: Combine stats + market odds ${JSON.stringify(odds)} for a 'High Value' tip.
                        BE SPECIFIC: Mention specific players injured or exact goal counts. Keep it under 80 words.`
                    },
                    {
                        role: "user",
                        content: `Comprehensive Scout Report: ${home_team} (Home) vs ${away_team} (Away). League: ${sport_title}.`
                    }
                ],
                temperature: 0.2 // Lower temperature for more factual accuracy
            })
        });

        const data = await groq.json();
        const report = data.choices[0].message.content;
        return res.status(200).json({ prediction: report });
    } catch (e) {
        return res.status(500).json({ prediction: "Scout research failed. Check API logs." });
    }
}
