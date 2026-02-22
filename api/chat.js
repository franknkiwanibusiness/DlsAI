import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { message } = req.body;
    // Your JWT API Key
    const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZyYW5rbmtpd2FuaUBnbWFpbC5jb20iLCJ0aWVyIjoiZnJlZSIsInVzZXJJZCI6InUwTlNoZmR5SjZROVJ5Z1NodXdHVGJZMEdoUTIiLCJpYXQiOjE3NzE3NTIzMzEsImV4cCI6MTgwMzI4ODMzMX0.GVGzPppZcMsZp-3kga8Ok6Xk6D8YKBTjc6czTWmcsyc";

    const fetchSportsData = async () => {
        try {
            // Fetching upcoming fixtures for the next 7 days
            const response = await fetch(`https://api.realtimesportsapi.com/v1/football/fixtures?days=7`, {
                headers: { "Authorization": `Bearer ${API_KEY}` }
            });
            const data = await response.json();
            return data.data || data.results || [];
        } catch { return []; }
    };

    const fixtures = await fetchSportsData();

    if (fixtures.length === 0) {
        return res.status(200).json({ 
            choices: [{ message: { content: "### API Offline | MARKET: N/A | ODDS: 0.00 | WHY: No live data available or API limit hit." } }] 
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemma-3-4b-it" });

        const SYSTEM_PROMPT = `
            ROLE: Elite Risk Auditor.
            DATA: ${JSON.stringify(fixtures.slice(0, 30))}

            TASK:
            1. Find matches that match: "${message}".
            2. For each match, find the "odds" or "price" in the data. If odds are missing, estimate based on probability (range 1.30 to 4.50).
            3. Pick the 3 SAFEST bets.
            4. FORMAT:
            ### [Home] vs [Away] | MARKET: [Pick] | ODDS: [Price] | WHY: [Tactical reason]
            
            TOTAL MULTI: [Result of Odds1 * Odds2 * Odds3]
        `;

        const result = await model.generateContent(SYSTEM_PROMPT);
        return res.status(200).json({ choices: [{ message: { content: result.response.text().trim() } }] });
    } catch (e) {
        return res.status(500).json({ error: "Engine Fault" });
    }
}
