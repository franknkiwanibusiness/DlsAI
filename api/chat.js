import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { message } = req.body;

    // 1. Fetch Real-Time Odds Data
    const getOdds = async () => {
        try {
            const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=826ccd6998728ab23f00ac7ad0546c2b&regions=eu&markets=h2h,totals,btts&oddsFormat=decimal`);
            const data = await response.json();
            return Array.isArray(data) ? data.slice(0, 35) : [];
        } catch { return []; }
    };

    const oddsData = await getOdds();

    try {
        // 2. Initialize Gemma via Google AI
        // Ensure your Vercel Environment Variable is named: GEMINI_API_KEY
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Target Gemma 3
        const model = genAI.getGenerativeModel({ model: "gemma-3-4b-it" });

        const SYSTEM_PROMPT = `
            ROLE: Elite Risk Auditor.
            DATE: Sunday, Feb 22, 2026.
            DATA: ${JSON.stringify(oddsData)}

            INSTRUCTIONS:
            1. Analyze the data pool for: ${message}.
            2. 100-SCENARIO TEST: Pick the one market (H2H, Over/Under, or BTTS) for each match that survives red cards or injuries.
            3. ANTI-FAVORITE: Avoid low-odds traps. Pick value.
            4. NO CHATTING. NO INTROS.
            
            STRICT FORMAT:
            ### [Home] vs [Away] | MARKET: [Pick] | ODDS: [Price] | WHY: [Tactical reason]
            
            TOTAL MULTI: [X.XX]
        `;

        const result = await model.generateContent(SYSTEM_PROMPT);
        const responseText = result.response.text();

        // 3. Send structured response to frontend
        return res.status(200).json({ 
            choices: [{ message: { content: responseText } }] 
        });

    } catch (error) {
        console.error("Gemma Engine Error:", error);
        return res.status(500).json({ 
            error: "Engine Fault", 
            details: error.message 
        });
    }
}
