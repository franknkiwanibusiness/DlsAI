export default async function handler(req, res) {
    const GROQ_API = process.env.EASYBET_API_KEY;
    const GEMINI_API = process.env.GEMINI_API_KEY;
    const ODDS_API = process.env.THE_ODDS_API || "10257181b61bdaba7ac4ca4e276c9dae";

    try {
        // 1. Fetch Live Fixtures (The Odds API)
        const oddsRes = await fetch(`https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=us&markets=h2h&apiKey=${ODDS_API}`);
        const oddsData = await oddsRes.json();

        // 2. AI Research (Groq - Llama 3 70B)
        // We ask for a clean string to avoid parsing errors
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${GROQ_API}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                model: "llama3-70b-8192",
                messages: [{ 
                    role: "user", 
                    content: "List 5 real sports betting big wins from Jan/Feb 2026. Format exactly like this: WINNER - AMOUNT - EVENT. No numbers, no intro, just the lines." 
                }],
                temperature: 0.5
            })
        });
        
        const aiData = await groqRes.json();
        const rawNews = aiData.choices[0].message.content;
        const newsArray = rawNews.split('\n').filter(line => line.length > 5);

        // 3. Send combined data
        res.status(200).json({ 
            news: newsArray, 
            fixtures: Array.isArray(oddsData) ? oddsData.slice(0, 15) : [] 
        });

    } catch (error) {
        console.error("Serverless Error:", error);
        res.status(200).json({ 
            news: ["DATA SYNC DELAYED - RETRYING..."], 
            fixtures: [] 
        });
    }
}
