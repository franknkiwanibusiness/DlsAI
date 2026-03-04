export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { home_team, away_team, odds, sport_title } = req.body;
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gemma-3-27b-it", // Using the heavy 27B instruction-tuned model
                messages: [
                    {
                        role: "system",
                        content: `You are the Gemma 3 27B Analytics Engine. Today is ${today}.
                        
                        CORE PROTOCOL:
                        1. ANALYZE: ${home_team} vs ${away_team} in ${sport_title}.
                        2. INTERNAL RESEARCH: Access March 2026 league dynamics. 
                        3. HOME/AWAY BIAS: Evaluate ${home_team}'s home form vs ${away_team}'s road stats.
                        4. ODDS DRIFT: Use H:${odds.h}, D:${odds.d}, A:${odds.a} to find the value gap.
                        
                        CRITICAL: Provide a data-driven scout report focusing on lineups and historical H2H trends. 
                        Output exactly 2 sentences. Use **bold** for the recommended market.`
                    },
                    {
                        role: "user",
                        content: `Scout report for ${home_team} vs ${away_team}.`
                    }
                ],
                temperature: 0.15 
            })
        });

        const data = await response.json();
        const verdict = data.choices[0].message.content;

        return res.status(200).json({ prediction: verdict });

    } catch (e) {
        return res.status(500).json({ prediction: "Gemma 3 27B is currently analyzing deep markets. Stand by." });
    }
}
