export default async function handler(req, res) {
    const { home_team, away_team, odds, sport_title } = req.body;
    const today = "Wednesday, March 4, 2026";

    // API Keys from your environment
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const GROQ_KEY = process.env.EASYBET_API_KEY;

    try {
        // --- STAGE 1: THE SCOUT (Gemini 3 Flash) ---
        // Does the heavy lifting of searching the 2026 live web
        const scoutRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Today is ${today}. SEARCH LIVE: ${home_team} vs ${away_team}. 
                Find: 1. 2026 Table (Arsenal 1st, Villa 4th, Chelsea 6th). 
                2. Status of John McGinn, Pedro Neto (Suspended), and Manager Liam Rosenior. 
                3. Last 3 results in Feb/March 2026. Return facts only.` }] }],
                tools: [{ googleSearch: {} }]
            })
        });
        const scoutData = await scoutRes.json();
        const research = scoutData.candidates[0].content.parts[0].text;

        // --- STAGE 2: THE QUANT (Gemma 2 9b via Groq) ---
        // Uses your EASYBET_API_KEY to wipe margins
        const quantRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "gemma2-9b-it",
                messages: [{ role: "user", content: `You are THE QUANT. 
                1. Odds: H:${odds.h}, D:${odds.d}, A:${odds.a}. 
                2. Research: ${research}. 
                3. TASK: Wipe the bookie margin to find fair probability. If margin is high or research (like Neto's red card) contradicts the odds, flag as "HIGH RISK TRAP".` }],
                temperature: 0
            })
        });
        const quantData = await quantRes.json();
        const calculations = quantData.choices[0].message.content;

        // --- STAGE 3: THE FINAL BOSS (Llama 3.3 70B via Groq) ---
        // The final audit and market pivot
        const bossRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: `You are THE FINAL BOSS. Review the SCOUT facts and the QUANT math. Today is ${today}. If the 1X2 market is a "trap" or "high risk", pivot to a safer market like Corners, BTTS, or Team Goals.` },
                    { role: "user", content: `Facts: ${research}. Math: ${calculations}. Give the lethal verdict.` }
                ]
            })
        });
        const bossData = await bossRes.json();
        const finalVerdict = bossData.choices[0].message.content;

        // Return the final result to the frontend
        return res.status(200).json({ prediction: finalVerdict });

    } catch (e) {
        console.error("Pipeline Error:", e);
        return res.status(500).json({ error: "Final Boss Pipeline Crashed" });
    }
}
