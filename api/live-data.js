export default async function handler(req, res) {
    const GROQ_API = process.env.EASYBET_API_KEY;
    const ODDS_API = process.env.THE_ODDS_API || "10257181b61bdaba7ac4ca4e276c9dae";

    try {
        // 1. Fetch Live Fixtures
        const oddsRes = await fetch(`https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=us&markets=h2h&apiKey=${ODDS_API}`);
        const oddsData = await oddsRes.json();

        // 2. Fetch AI Research (Groq)
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_API}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "mixtral-8x7b-32768",
                messages: [{ role: "user", content: "List 5 major sports betting wins or massive upsets from the last 60 days. Keep each under 15 words. Format: TEAM/PLAYER - WIN AMOUNT - EVENT." }]
            })
        });
        const aiData = await groqRes.json();
        const news = aiData.choices[0].message.content.split('\n').filter(line => line.trim());

        res.status(200).json({ news, fixtures: oddsData.slice(0, 15) });
    } catch (error) {
        res.status(500).json({ error: "API Fetch Failed" });
    }
}
