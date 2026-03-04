export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { home_team, away_team, odds } = req.body;
    const GROQ_KEY = process.env.EASYBET_API_KEY;

    // The "All-in-One" Prompt
    const prompt = `
    TODAY'S DATE: March 4, 2026.
    FIXTURE: ${home_team} vs ${away_team}
    BOOKIE ODDS: Home(${odds.h}), Draw(${odds.d}), Away(${odds.a})

    INSTRUCTIONS:
    1. Act as a Master Analyst and Quant.
    2. Calculate the 'True Probability' by stripping the bookie margin.
    3. Use 2026 Season Context: (Arsenal is 1st, Villa 4th, Chelsea 6th. Pedro Neto is suspended, John McGinn has a minor knee issue).
    4. If the odds for the favorite are too low compared to the risk (Value Trap), PIVOT to a safer market like "Over 1.5 Goals", "Double Chance", or "Corners".
    
    OUTPUT: Provide a 1-sentence logic and then the final pick in **BOLD**.
    `;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2,
                max_tokens: 150
            })
        });

        const data = await response.json();
        
        if (!data.choices) {
            return res.status(500).json({ error: "Groq API Limit Reached or Error" });
        }

        return res.status(200).json({ prediction: data.choices[0].message.content });

    } catch (e) {
        return res.status(500).json({ error: "Server connection failed" });
    }
}
