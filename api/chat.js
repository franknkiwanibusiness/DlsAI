import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { message } = req.body;
    const API_KEY = "826ccd6998728ab23f00ac7ad0546c2b";
    
    // We fetch 'upcoming' to see everything across all leagues for the next few days
    const getVerifiedOdds = async () => {
        try {
            const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals,btts&oddsFormat=decimal`);
            const data = await response.json();
            
            if (!Array.isArray(data)) return [];

            const now = new Date();
            const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

            return data.filter(match => {
                const matchTime = new Date(match.commence_time);
                return matchTime >= now && matchTime <= sevenDaysFromNow;
            }).slice(0, 40);
        } catch { return []; }
    };

    const verifiedPool = await getVerifiedOdds();

    // If the API is truly empty, we tell the user clearly without crashing the UI
    if (verifiedPool.length === 0) {
        return res.status(200).json({ 
            choices: [{ message: { content: "### No Live Data | MARKET: API Empty | ODDS: 1.00 | WHY: The Odds API returned no matches for the next 7 days. Check your API quota.\n\nTOTAL MULTI: 1.00" } }] 
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemma-3-4b-it" });

        const SYSTEM_PROMPT = `
            ROLE: Elite Risk Auditor.
            DATE: ${new Date().toISOString()}
            DATA: ${JSON.stringify(verifiedPool)}

            STRICT INSTRUCTIONS:
            1. ONLY use matches from the DATA provided. 
            2. If the user asks for "Laliga" and it's not in the data, pick the 3 BEST VALUE matches available instead.
            3. NO INTROS. NO "Okay". NO EXPLANATIONS.
            4. 100-SCENARIO TEST: Pick markets that survive red cards.
            
            STRICT FORMAT:
            ### [Home] vs [Away] | MARKET: [Pick] | ODDS: [Price] | WHY: [Tactical reason]
            
            TOTAL MULTI: [X.XX]
        `;

        const result = await model.generateContent(SYSTEM_PROMPT + "\nRequest: " + message);
        let responseText = result.response.text().trim();

        // Safety: Strip out any "yapping" sentences before the first ###
        if (responseText.includes('###')) {
            responseText = responseText.substring(responseText.indexOf('###'));
        }

        return res.status(200).json({ 
            choices: [{ message: { content: responseText } }] 
        });

    } catch (error) {
        return res.status(500).json({ error: "Audit Engine Failure" });
    }
}
