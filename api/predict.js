export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { home_team, away_team, odds, sport_title } = req.body;
    
    // Dynamic Date Injection
    const today = new Date().toLocaleDateString('en-GB', { 
        day: 'numeric', month: 'long', year: 'numeric' 
    });

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
                        content: `You are a 2026 Pro Betting Scout. Today's Date: ${today}.
                        
                        CURRENT DATA (MARCH 2026):
                        - Arsenal (1st, 64pts), Man City (2nd, 59pts), Man Utd (3rd, 51pts), Aston Villa (4th, 51pts).
                        - Chelsea (6th, 45pts), Brighton (12th, 37pts).
                        - Injuries: John McGinn (Villa) is OUT. Declan Rice & Martin Odegaard (Arsenal) are DOUBTFUL. Pedro Neto (Chelsea) is SUSPENDED.
                        
                        TASK: Analyze ${home_team} vs ${away_team}. 
                        1. Compare ${home_team}'s Home strength vs ${away_team}'s Away vulnerability.
                        2. Factor in the odds: H:${odds.h}, D:${odds.d}, A:${odds.a}.
                        3. Provide a 'Sharp Verdict' for the best market (H2H, BTTS, or O/U).
                        Format: Max 70 words. Bold key players and the final pick.`
                    },
                    {
                        role: "user",
                        content: `Scout report: ${home_team} vs ${away_team}.`
                    }
                ],
                temperature: 0.2 // Keeps logic tight and prevents "hallucinations"
            })
        });

        const data = await response.json();
        
        // Error handling if the API fails or returns empty
        if (!data.choices || data.choices.length === 0) {
            throw new Error("Llama failed to generate a response");
        }

        const verdict = data.choices[0].message.content;
        return res.status(200).json({ prediction: verdict });

    } catch (e) {
        console.error("API Error:", e.message);
        return res.status(500).json({ 
            prediction: "Scout research blocked by network error. Check API logs." 
        });
    }
}
