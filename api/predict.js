export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { home_team, away_team, odds, sport_title } = req.body;
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    try {
        // --- STEP 1: GEMINI RESEARCHES THE FACTS ---
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Search for live March 2026 data: ${home_team} vs ${away_team} in ${sport_title}. 
                        Provide exactly these facts: 
                        1. Current 2026 Table positions and GD. 
                        2. Last 3 results for both. 
                        3. Confirmed injuries today (${today}).`
                    }]
                }]
            })
        });
        const geminiData = await geminiRes.json();
        const researchData = geminiData.candidates[0].content.parts[0].text;

        // --- STEP 2: GROQ ANALYZES & GIVES THE TIP ---
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
                        content: `You are a Betting Expert. Use this RESEARCH: "${researchData}". 
                        Combine it with these ODDS: Home ${odds.h}, Draw ${odds.d}, Away ${odds.a}.
                        Give a sharp 2-sentence prediction. Bold the key betting market.`
                    },
                    {
                        role: "user",
                        content: `What is the smart play for ${home_team} vs ${away_team}?`
                    }
                ],
                temperature: 0.2
            })
        });

        const groqData = await groqRes.json();
        const finalVerdict = groqData.choices[0].message.content;

        return res.status(200).json({ 
            prediction: finalVerdict,
            debug_research: researchData // Optional: use this to see what Gemini found
        });

    } catch (e) {
        return res.status(500).json({ prediction: "Research sync failed. Trying backup..." });
    }
}
