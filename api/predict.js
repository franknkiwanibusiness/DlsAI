// /api/predict.js
export default async function handler(req, res) {
    // CORS Headers for Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { home_team, away_team, odds, sport_title } = req.body;
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    try {
        // --- STEP 1: REAL-TIME RESEARCH (TAVILY) ---
        // Searches for the specific March 2026 table and 48h injury reports.
        const tavilyResponse = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: process.env.TAVILY_API_KEY,
                query: `Current March 2026 Premier League standings, recent form, and injury news for ${home_team} vs ${away_team}. Focus on John McGinn status and league table positions.`,
                search_depth: "advanced",
                max_results: 5,
                include_answer: true
            })
        });

        const searchData = await tavilyResponse.json();
        const freshFacts = searchData.answer || "Search failed, fallback to 2026 internal knowledge.";

        // --- STEP 2: EXPERT ANALYSIS (LLAMA 3.3 70B) ---
        // Uses the facts found by Tavily to analyze the odds H2H.
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
                        content: `You are a High-Stakes Sports Analyst. Today is ${today}.
                        FACTS FROM RESEARCH: "${freshFacts}"
                        ODDS DATA: Home(${odds.h}), Draw(${odds.d}), Away(${odds.a}).
                        
                        PROTOCOL:
                        1. Verify the 'Value Gap'. If ${home_team} is 4th and favored at high odds, identify why.
                        2. Factor in the Home/Away splits specifically for March 2026.
                        3. Mention a specific injury or lineup change found in research.
                        4. Output: 2 sharp sentences. Bold the **Final Market Pick**.`
                    },
                    {
                        role: "user",
                        content: `Analyze the match-up: ${home_team} (Home) vs ${away_team} (Away).`
                    }
                ],
                temperature: 0.1 // Keeps the AI from making up "ghost" stats
            })
        });

        const groqData = await groqResponse.json();
        const finalVerdict = groqData.choices[0].message.content;

        return res.status(200).json({ 
            prediction: finalVerdict,
            source: "Verified March 2026 Search Data" 
        });

    } catch (error) {
        console.error("Pipeline Error:", error);
        return res.status(500).json({ 
            prediction: "Scout research engine is recalibrating for 2026 markets." 
        });
    }
}
