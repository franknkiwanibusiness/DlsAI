import { GoogleGenerativeAI } from "@google/generative-ai";

async function getLiveSportsData(targetDate) {
    try {
        const apiKey = "826ccd6998728ab23f00ac7ad0546c2b"; // Your Odds API Key
        const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer_uefa_champions_league/odds/?apiKey=${apiKey}&regions=eu&markets=h2h&oddsFormat=decimal`);
        const data = await response.json();

        if (!Array.isArray(data)) return "No fixtures found.";

        // Filter or prioritize based on date mentioned in user message
        return data.slice(0, 6).map(match => {
            const home = match.home_team;
            const away = match.away_team;
            const bookie = match.bookmakers[0];
            const odds = bookie ? bookie.markets[0].outcomes : [];
            const h = odds.find(o => o.name === home)?.price || "1.0";
            const a = odds.find(o => o.name === away)?.price || "1.0";
            const d = odds.find(o => o.name === "Draw")?.price || "1.0";

            return `MATCH: ${home} vs ${away} | H: ${h} | D: ${d} | A: ${a}`;
        }).join('\n');
    } catch (err) { return "Offline"; }
}

export default async function handler(req, res) {
    const { message, modelType } = req.body;
    const liveData = await getLiveSportsData(message); //

    const ELITE_PROMPT = `
        STRICT RULES:
        1. NO PARAGRAPHS. NO "HELLO".
        2. Format every match: ### [Home] vs [Away] | MARKET: [Pick] | ODDS: [Price]
        3. TOTAL ODDS: At the end, multiply the odds of your top 3 picks and show: "TOTAL MULTI: [X.XX]"
        4. DATA TO USE:
        ${liveData}
    `;

    try {
        if (modelType === 'gemini') {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemma-3-4b-it" });
            const result = await model.generateContent([{ text: ELITE_PROMPT }, { text: message }]);
            return res.status(200).json({ choices: [{ message: { content: result.response.text() } }] });
        } else {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${process.env.EASYBET_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "llama-3.2-11b-vision-preview",
                    messages: [{ role: "system", content: ELITE_PROMPT }, { role: "user", content: message }],
                    temperature: 0.2
                }),
            });
            const data = await response.json();
            return res.status(200).json(data);
        }
    } catch (e) { return res.status(500).json({ error: "Fault" }); }
}
