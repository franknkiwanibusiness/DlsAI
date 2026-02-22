import { GoogleGenerativeAI } from "@google/generative-ai";

async function getLiveSportsData() {
    try {
        const apiKey = "826ccd6998728ab23f00ac7ad0546c2b";
        // Fetching top markets to allow the AI to avoid the "Home Win" trap
        const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,totals,btts&oddsFormat=decimal`);
        const data = await response.json();

        if (!Array.isArray(data)) return "NO_DATA";

        // Map the real data to a format the Auditor can analyze
        return data.slice(0, 40).map(match => {
            const bookie = match.bookmakers[0];
            const getMkt = (key) => bookie?.markets.find(m => m.key === key)?.outcomes || [];
            return {
                match: `${match.home_team} vs ${match.away_team}`,
                league: match.sport_title,
                time: match.commence_time,
                h2h: getMkt('h2h').map(o => `${o.name}:${o.price}`).join(','),
                totals: getMkt('totals').map(o => `${o.name}${o.point || ''}:${o.price}`).join(','),
                btts: getMkt('btts').map(o => `${o.name}:${o.price}`).join(',')
            };
        });
    } catch (err) { return []; }
}

export default async function handler(req, res) {
    const { message } = req.body;
    const realMatches = await getLiveSportsData();

    const SYSTEM_PROMPT = `
        ROLE: Elite Risk Auditor.
        TODAY'S DATE: Sunday, Feb 22, 2026.
        
        DATA POOL: ${JSON.stringify(realMatches)}

        STRICT RULES:
        1. NO HALLUCINATIONS. Only use matches provided in the DATA POOL.
        2. TARGET DATE: Focus on matches for Feb 22 or Feb 24 as requested.
        3. ANTI-FAVORITE: 100-scenario simulation. If a favorite is risky, pick Under/Over or BTTS.
        4. NO CHATTING. Output only the cards.

        FORMAT:
        ### [Home] vs [Away] | MARKET: [Pick] | ODDS: [Price] | WHY: [Sharp reason]
        
        TOTAL MULTI: [X.XX]
    `;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(SYSTEM_PROMPT + "\nUser: " + message);
        res.status(200).json({ choices: [{ message: { content: result.response.text() } }] });
    } catch (e) { res.status(500).json({ error: "Audit Error" }); }
}
