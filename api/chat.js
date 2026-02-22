import { GoogleGenerativeAI } from "@google/generative-ai";

async function getLiveSportsData() {
    try {
        const apiKey = "826ccd6998728ab23f00ac7ad0546c2b";
        // Fetching H2H, Totals, and BTTS to prevent "Home Win" bias
        const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,totals,btts&oddsFormat=decimal`);
        const data = await response.json();

        if (!Array.isArray(data)) return "NO_DATA";

        return data.slice(0, 40).map(match => {
            const bookie = match.bookmakers[0];
            const getMkt = (key) => bookie?.markets.find(m => m.key === key)?.outcomes || [];
            return {
                match: `${match.home_team} vs ${match.away_team}`,
                league: match.sport_title,
                h2h: getMkt('h2h').map(o => `${o.name}:${o.price}`).join(','),
                totals: getMkt('totals').map(o => `${o.name}${o.point || ''}:${o.price}`).join(','),
                btts: getMkt('btts').map(o => `${o.name}:${o.price}`).join(',')
            };
        });
    } catch (err) { return []; }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { message, modelType } = req.body;
    const realMatches = await getLiveSportsData();

    const SYSTEM_PROMPT = `
        ROLE: Elite Risk Auditor.
        TODAY: Sunday, Feb 22, 2026.
        DATA POOL: ${JSON.stringify(realMatches)}

        INSTRUCTIONS:
        1. Find 3 matches for the requested date/league.
        2. Perform a 100-scenario simulation. Pick the market that survives red cards/injuries.
        3. NO CHATTING. NO INTROS.
        4. Use this EXACT format or the engine will crash:
        
        ### [Home] vs [Away] | MARKET: [Pick] | ODDS: [Price] | WHY: [Tactical reason]
        
        TOTAL MULTI: [X.XX]
    `;

    try {
        // Initialize Gemini (Ensure GEMINI_API_KEY is in your Vercel Environment Variables)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent(SYSTEM_PROMPT + "\nUser Request: " + message);
        const responseText = result.response.text();

        return res.status(200).json({ 
            choices: [{ 
                message: { content: responseText } 
            }] 
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Engine Fault", details: e.message });
    }
}
