import { GoogleGenerativeAI } from "@google/generative-ai";

async function getDeepMarketData() {
    try {
        const apiKey = "826ccd6998728ab23f00ac7ad0546c2b";
        // Fetching EVERY major market: H2H, Totals, BTTS, and Spread
        const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,totals,btts,spreads&oddsFormat=decimal`);
        const data = await response.json();

        if (!Array.isArray(data)) return "DATA_UNAVAILABLE";

        return data.slice(0, 40).map(match => {
            const bookie = match.bookmakers[0];
            const getMkt = (key) => bookie?.markets.find(m => m.key === key)?.outcomes || [];
            
            const h2h = getMkt('h2h');
            const totals = getMkt('totals');
            const btts = getMkt('btts');

            return {
                teams: `${match.home_team} vs ${match.away_team}`,
                league: match.sport_title,
                h2h: h2h.map(o => `${o.name}:${o.price}`).join(','),
                totals: totals.map(o => `${o.name}${o.point || ''}:${o.price}`).join(','),
                btts: btts.map(o => `${o.name}:${o.price}`).join(',')
            };
        });
    } catch (err) { return []; }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { message, modelType } = req.body;
    const marketPool = await getDeepMarketData();

    const AUDITOR_PROMPT = `
        You are the ELITE RISK AUDITOR. Your job is to find the 100% "Smartest" market.
        
        CRITICAL RULES:
        1. FOOTBALL IS UNPREDICTABLE: Assume a Red Card, Injury, or "Park the Bus" tactic could happen.
        2. ANTI-FAVORITE BIAS: Do NOT pick a 1.20 favorite just because they are big. If the value is in "Under 2.5" or "BTTS-No", pick that.
        3. 100-SCENARIO CHECK: Before choosing, mentally simulate the match 100 times. Pick the market that wins in 90/100 simulations.
        4. MARKET DIVERSITY: Scan H2H, Over/Under, and BTTS. Pick ONLY the single best market per match.
        
        DATA POOL:
        ${JSON.stringify(marketPool)}

        STRICT OUTPUT FORMAT (No yapping):
        ### [Home] vs [Away] | MARKET: [Pick Name] | ODDS: [Price] | WHY: [Sharp tactical reason why this survives an injury/red card]

        TOTAL MULTI: [Multiply the odds]
    `;

    try {
        let responseText = "";

        if (modelType === 'gemini') {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Fast & Accurate
            const result = await model.generateContent(AUDITOR_PROMPT + "\nUser Request: " + message);
            responseText = result.response.text();
        } else {
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile", // Use the 70B for deeper reasoning
                    messages: [{ role: "system", content: AUDITOR_PROMPT }, { role: "user", content: message }],
                    temperature: 0.3 // Keeps it focused on data, not chat
                }),
            });
            const data = await groqRes.json();
            responseText = data.choices[0].message.content;
        }

        res.status(200).json({ choices: [{ message: { content: responseText } }] });
    } catch (e) {
        res.status(500).json({ error: "Audit Failed" });
    }
}
