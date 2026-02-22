import { GoogleGenerativeAI } from "@google/generative-ai";

async function getEliteOdds() {
    try {
        const apiKey = "826ccd6998728ab23f00ac7ad0546c2b";
        // Fetching all upcoming soccer matches to ensure we find La Liga/UCL
        const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${apiKey}&regions=eu&markets=h2h`);
        const data = await response.json();

        if (!Array.isArray(data)) return "NO_DATA";

        return data.slice(0, 40).map(match => {
            const bookie = match.bookmakers[0];
            const odds = bookie ? bookie.markets[0].outcomes : [];
            const h = odds.find(o => o.name === match.home_team)?.price || "1.0";
            const a = odds.find(o => o.name === match.away_team)?.price || "1.0";
            const d = odds.find(o => o.name === "Draw")?.price || "1.0";
            return `${match.sport_title} | ${match.home_team} vs ${match.away_team} | H:${h} | D:${d} | A:${a}`;
        }).join('\n');
    } catch (err) { return "OFFLINE"; }
}

export default async function handler(req, res) {
    const { message, modelType } = req.body;
    const allFixtures = await getEliteOdds();

    const SYSTEM_PROMPT = `
        You are the Smart Betting Auditor. 
        DATE: Sunday 22 February 2026.
        USER REQUEST: ${message}

        DATA POOL:
        ${allFixtures}

        STRICT INSTRUCTIONS:
        1. Find matches that fit the USER REQUEST (e.g., La Liga, Champions League).
        2. NO CHATTING. NO INTROS.
        3. OUTPUT ONLY THIS FORMAT:
        ### [Home] vs [Away] | MARKET: [Best Pick] | ODDS: [Price]
        4. END WITH: TOTAL MULTI: [X.XX]
    `;

    try {
        if (modelType === 'gemini') {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemma-3-4b-it" });
            const result = await model.generateContent(SYSTEM_PROMPT);
            return res.status(200).json({ choices: [{ message: { content: result.response.text() } }] });
        } else {
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "llama-3.2-11b-vision-preview",
                    messages: [{ role: "system", content: SYSTEM_PROMPT }],
                    temperature: 0.1
                }),
            });
            const data = await groqRes.json();
            return res.status(200).json(data);
        }
    } catch (e) { return res.status(500).json({ error: "API_FAULT" }); }
}
