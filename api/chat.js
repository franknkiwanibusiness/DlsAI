import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { message } = req.body;
    const API_KEY = "826ccd6998728ab23f00ac7ad0546c2b";
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();

    // 1. Fetch and Filter Real Data
    const getVerifiedOdds = async () => {
        try {
            const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals,btts&oddsFormat=decimal`);
            const data = await response.json();
            
            if (!Array.isArray(data)) return [];

            // Filter for matches occurring within the next 7 days ONLY
            return data.filter(match => {
                const matchTime = new Date(match.commence_time);
                return matchTime > now && (matchTime - now) < SEVEN_DAYS_MS;
            }).slice(0, 30);
        } catch { return []; }
    };

    const verifiedPool = await getVerifiedOdds();

    // 2. Kill switch if no real data exists
    if (verifiedPool.length === 0) {
        return res.status(200).json({ 
            choices: [{ message: { content: "### No Fixtures | MARKET: None | ODDS: 1.00 | WHY: No verified matches found in the next 7 days." } }] 
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemma-3-4b-it" });

        const SYSTEM_PROMPT = `
            ROLE: Elite Risk Auditor.
            CURRENT_TIME: ${now.toISOString()}
            DATA_POOL: ${JSON.stringify(verifiedPool)}

            CRITICAL COMMANDS:
            1. ONLY use matches from the DATA_POOL. If a match is not in the pool, it does not exist.
            2. NO HALLUCINATIONS. No "Real Madrid vs Barcelona" unless it is in the pool.
            3. NO INTROS/OUTROS. No "Understood" or "Here is the data".
            4. 100-SCENARIO TEST: Pick the safest market that survives red cards/injuries.
            
            STRICT OUTPUT FORMAT:
            ### [Home] vs [Away] | MARKET: [Pick] | ODDS: [Price] | WHY: [1 tactical sentence]
            
            TOTAL MULTI: [X.XX]
        `;

        const result = await model.generateContent(SYSTEM_PROMPT + "\nRequest: " + message);
        const responseText = result.response.text().trim();

        return res.status(200).json({ 
            choices: [{ message: { content: responseText } }] 
        });

    } catch (error) {
        return res.status(500).json({ error: "Audit Engine Offline" });
    }
}
