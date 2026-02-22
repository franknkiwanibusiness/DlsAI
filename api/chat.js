import { GoogleGenerativeAI } from "@google/generative-ai";

async function getDeepMarketData() {
    try {
        const apiKey = "826ccd6998728ab23f00ac7ad0546c2b";
        // Fetching real-time odds for H2H, Over/Under, and BTTS
        const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,totals,btts&oddsFormat=decimal`);
        const data = await response.json();

        if (!Array.isArray(data)) return [];

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
    } catch (err) {
        return [];
    }
}

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    try {
        const { message } = req.body;
        const realMatches = await getDeepMarketData();

        // 1. Initialize Gemini with your Vercel Environment Variable
        // IMPORTANT: Ensure your key in Vercel is named exactly: GEMINI_API_KEY
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const SYSTEM_PROMPT = `
            ROLE: Elite Risk Auditor.
            DATE: Sunday, Feb 22, 2026.
            DATA POOL: ${JSON.stringify(realMatches)}

            INSTRUCTIONS:
            1. Scrutinize the data pool for matches fitting: ${message}.
            2. 100-SCENARIO TEST: Pick the market (H2H, Over/Under, or BTTS) that survives a Red Card or Injury simulation.
            3. NO CHATTING. NO INTROS. STRICT OUTPUT ONLY.
            
            FORMAT:
            ### [Home] vs [Away] | MARKET: [Pick] | ODDS: [Price] | WHY: [1 tactical sentence]
            
            TOTAL MULTI: [Multiply the 3 Odds]
        `;

        const result = await model.generateContent(SYSTEM_PROMPT);
        const responseText = result.response.text();

        // Send back the response in the format the frontend expects
        return res.status(200).json({ 
            choices: [{ message: { content: responseText } }] 
        });

    } catch (error) {
        console.error("Gemini Error:", error);
        return res.status(500).json({ 
            error: "Engine Fault", 
            details: error.message 
        });
    }
}
