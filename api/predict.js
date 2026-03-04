export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { home_team, away_team, odds, sport_title } = req.body;

    // Get current date dynamically
    const today = new Date().toLocaleDateString('en-GB', { 
        day: 'numeric', month: 'long', year: 'numeric' 
    });

    try {
        const groq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", 
                messages: [
                    {
                        role: "system",
                        content: `Today is ${today}. You are a Deep Research Sports Scout.
                        Task: Analyze ${home_team} (HOME) vs ${away_team} (AWAY) in ${sport_title}.
                        
                        REQUIREMENTS:
                        1. RESEARCH BOTH: Get 2026 Table positions, Goal Difference, and 30-day form for BOTH.
                        2. HOME/AWAY SPLITS: Compare ${home_team}'s home record vs ${away_team}'s away record.
                        3. UPDATES: Check injuries/lineups from the last 48 hours (e.g., John McGinn's status for Villa).
                        4. UEFA: If international, check cross-league history.
                        5. VERDICT: Suggest the best market (H2H, O/U, BTTS) based on this data.
                        
                        OUTPUT: Max 80 words. Be sharp and data-heavy.`
                    },
                    {
                        role: "user",
                        content: `Provide a Deep Scout report for ${home_team} vs ${away_team} for today, ${today}.`
                    }
                ],
                temperature: 0.2
            })
        });

        const data = await groq.json();
        const report = data.choices[0].message.content;
        return res.status(200).json({ prediction: report });
    } catch (e) {
        return res.status(500).json({ prediction: "Deep Research currently unavailable." });
    }
}
